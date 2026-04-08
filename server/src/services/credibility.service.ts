import {
  CredibilityEventType,
  DeclaredExperienceLevel,
  Prisma,
  PrismaClient,
  ProofVoteType,
  SkillProofType,
} from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

type DbClient = PrismaClient | Prisma.TransactionClient;

const DEFAULT_VOTER_EXPERIENCE = 0.25;
const MAX_PROOF_BONUS = 0.15;
const PROOF_BONUS_PER_VERIFIED = 0.05;
const PROOF_VERIFICATION_THRESHOLD = 0.2;
const MIN_PROOF_WEIGHT = 1;
const REPEATED_INTERACTION_THRESHOLD = 3;
const NEW_ACCOUNT_DAYS = 14;
const LOW_DIVERSITY_THRESHOLD = 2;
const JOB_FACTOR_CAP = Math.log(10);

export interface ExperienceScoreBreakdown {
  completionRate: number;
  avgRating: number;
  avgRatingNormalized: number;
  repeatClientsRatio: number;
  disputeRatio: number;
  disputePenalty: number;
  weightedBaseScore: number;
  jobsFactor: number;
  jobsFactorNormalized: number;
  declaredLevelSupport: number;
  proofBonus: number;
  finalScore: number;
  weightedReviewCount: number;
  flaggedReviewCount: number;
  lowTrustReviewCount: number;
  verifiedProofs: number;
}

export interface ProofVoteSummary {
  validVotes: number;
  fakeVotes: number;
  irrelevantVotes: number;
  proofScore: number;
  totalWeight: number;
  isVerified: boolean;
}

export interface CredibilityBreakdown extends ExperienceScoreBreakdown {
  occupationTitle: string | null;
  occupationCode: string | null;
  declaredLevel: 'beginner' | 'intermediate' | 'expert';
  experienceScore: number;
  experienceMultiplier: number;
  credibilityScore: number;
  jobsCompleted: number;
  repeatClients: number;
  disputeCount: number;
  badge: string;
  verifiedProofCount: number;
}

export interface ProofSummary {
  id: string;
  proofType: 'certificate' | 'portfolio' | 'link' | 'image';
  proofUrl: string;
  description: string | null;
  isVerified: boolean;
  createdAt: Date;
  votes: ProofVoteSummary;
}

export interface OccupationCredibilitySummary {
  occupationId: string;
  occupationTitle: string;
  occupationCode: string;
  declaredLevel: 'beginner' | 'intermediate' | 'expert';
  experienceScore: number;
  credibilityScore: number;
  experienceMultiplier: number;
  jobsCompleted: number;
  avgRating: number;
  repeatClients: number;
  disputeCount: number;
  verifiedProofs: number;
  badge: string;
}

interface ProofVoteInput {
  proofId: string;
  voterId: string;
  voteType: ProofVoteType;
}

interface CreateProofInput {
  userId: string;
  occupationId: string;
  proofType: SkillProofType;
  proofUrl: string;
  description?: string;
  declaredLevel?: DeclaredExperienceLevel;
}

interface LogEventInput {
  userId: string;
  occupationId: string;
  eventType: CredibilityEventType;
  metadata: Prisma.InputJsonValue;
  db?: DbClient;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number, decimals = 4): number {
  return Number(value.toFixed(decimals));
}

function normalizeDeclaredLevel(level: DeclaredExperienceLevel): 'beginner' | 'intermediate' | 'expert' {
  switch (level) {
    case DeclaredExperienceLevel.INTERMEDIATE:
      return 'intermediate';
    case DeclaredExperienceLevel.EXPERT:
      return 'expert';
    case DeclaredExperienceLevel.BEGINNER:
    default:
      return 'beginner';
  }
}

function normalizeProofType(proofType: SkillProofType): 'certificate' | 'portfolio' | 'link' | 'image' {
  switch (proofType) {
    case SkillProofType.CERTIFICATE:
      return 'certificate';
    case SkillProofType.PORTFOLIO:
      return 'portfolio';
    case SkillProofType.IMAGE:
      return 'image';
    case SkillProofType.LINK:
    default:
      return 'link';
  }
}

function getDeclaredLevelSignal(level: DeclaredExperienceLevel): number {
  switch (level) {
    case DeclaredExperienceLevel.EXPERT:
      return 0.8;
    case DeclaredExperienceLevel.INTERMEDIATE:
      return 0.55;
    case DeclaredExperienceLevel.BEGINNER:
    default:
      return 0.3;
  }
}

function getCredibilityBadge(experienceScore: number, verifiedProofs: number, disputeCount: number): string {
  const credibilityScore = Math.round(experienceScore * 100);

  if (credibilityScore >= 80 && verifiedProofs >= 1 && disputeCount <= 1) {
    return 'Trusted';
  }

  if (credibilityScore >= 65) {
    return 'Established';
  }

  if (credibilityScore >= 40) {
    return 'Building';
  }

  return 'New';
}

async function getVoterExperienceMap(
  db: DbClient,
  voterIds: string[],
  occupationId: string
): Promise<Map<string, number>> {
  if (voterIds.length === 0) {
    return new Map<string, number>();
  }

  const experiences = await db.userSkillExperience.findMany({
    where: {
      userId: { in: voterIds },
      occupationId,
    },
    select: {
      userId: true,
      experienceScore: true,
    },
  });

  return new Map(experiences.map((item) => [item.userId, item.experienceScore]));
}

class CredibilityService {
  async logEvent(input: LogEventInput): Promise<void> {
    const { userId, occupationId, eventType, metadata, db = prisma } = input;

    await db.credibilityEvent.create({
      data: {
        userId,
        occupationId,
        eventType,
        metadata,
      },
    });
  }

  async setDeclaredLevel(
    userId: string,
    occupationId: string,
    declaredLevel: DeclaredExperienceLevel,
    db: DbClient = prisma
  ): Promise<void> {
    await db.userSkillExperience.upsert({
      where: {
        userId_occupationId: {
          userId,
          occupationId,
        },
      },
      create: {
        userId,
        occupationId,
        declaredLevel,
      },
      update: {
        declaredLevel,
      },
    });
  }

  async calculateExperienceScore(
    userId: string,
    occupationId: string,
    db: DbClient = prisma,
    persist = true
  ): Promise<CredibilityBreakdown> {
    const [existingExperience, occupation, services, verifiedProofCount] = await Promise.all([
      db.userSkillExperience.findUnique({
        where: {
          userId_occupationId: {
            userId,
            occupationId,
          },
        },
      }),
      db.occupation.findUnique({
        where: { id: occupationId },
        select: {
          title: true,
          ncoCode: true,
        },
      }),
      db.service.findMany({
        where: {
          userId,
          occupationId,
        },
        select: {
          id: true,
        },
      }),
      db.userSkillProof.count({
        where: {
          userId,
          occupationId,
          isVerified: true,
        },
      }),
    ]);

    const serviceIds = services.map((service) => service.id);

    let allJobCount = 0;
    let completedExchanges: Array<{ id: string; requesterId: string }> = [];

    if (serviceIds.length > 0) {
      const [jobCount, completedJobs] = await Promise.all([
        db.exchange.count({
          where: {
            providerId: userId,
            serviceId: {
              in: serviceIds,
            },
          },
        }),
        db.exchange.findMany({
          where: {
            providerId: userId,
            status: 'COMPLETED',
            serviceId: {
              in: serviceIds,
            },
          },
          select: {
            id: true,
            requesterId: true,
          },
        }),
      ]);

      allJobCount = jobCount;
      completedExchanges = completedJobs;
    }

    const declaredLevel = existingExperience?.declaredLevel ?? DeclaredExperienceLevel.BEGINNER;
    const jobsCompleted = completedExchanges.length;
    const clientCounts = new Map<string, number>();

    for (const exchange of completedExchanges) {
      clientCounts.set(exchange.requesterId, (clientCounts.get(exchange.requesterId) ?? 0) + 1);
    }

    const repeatClients = Array.from(clientCounts.values()).filter((count) => count > 1).length;
    const completedExchangeIds = completedExchanges.map((exchange) => exchange.id);
    const reviews =
      completedExchangeIds.length > 0
        ? await db.review.findMany({
            where: {
              providerId: userId,
              exchangeId: {
                in: completedExchangeIds,
              },
            },
            select: {
              rating: true,
              reviewerId: true,
              reviewer: {
                select: {
                  createdAt: true,
                },
              },
              exchange: {
                select: {
                  requesterId: true,
                },
              },
            },
          })
        : [];
    const reviewerIds = Array.from(new Set(reviews.map((review) => review.reviewerId)));

    let reviewerCounterparties = new Map<string, Set<string>>();
    let reviewerExperienceMap = new Map<string, number>();

    if (reviewerIds.length > 0) {
      const reviewerExchanges = await db.exchange.findMany({
        where: {
          OR: [{ providerId: { in: reviewerIds } }, { requesterId: { in: reviewerIds } }],
        },
        select: {
          providerId: true,
          requesterId: true,
        },
      });

      reviewerCounterparties = new Map(reviewerIds.map((reviewerId) => [reviewerId, new Set<string>()]));
      for (const exchange of reviewerExchanges) {
        const providerCounterparties = reviewerCounterparties.get(exchange.providerId);
        if (providerCounterparties && exchange.requesterId !== exchange.providerId) {
          providerCounterparties.add(exchange.requesterId);
        }

        const requesterCounterparties = reviewerCounterparties.get(exchange.requesterId);
        if (requesterCounterparties && exchange.providerId !== exchange.requesterId) {
          requesterCounterparties.add(exchange.providerId);
        }
      }

      reviewerExperienceMap = await getVoterExperienceMap(db, reviewerIds, occupationId);
    }

    let weightedRatingSum = 0;
    let weightedReviewCount = 0;
    let flaggedReviewCount = 0;
    let lowTrustReviewCount = 0;
    let disputeCount = 0;

    for (const review of reviews) {
      const interactionCount = clientCounts.get(review.exchange.requesterId) ?? 0;
      const reviewerAgeMs = Date.now() - review.reviewer.createdAt.getTime();
      const reviewerAgeDays = reviewerAgeMs / (1000 * 60 * 60 * 24);
      const diversityCount = reviewerCounterparties.get(review.reviewerId)?.size ?? 0;

      let reviewWeight = clamp01(reviewerExperienceMap.get(review.reviewerId) ?? DEFAULT_VOTER_EXPERIENCE);
      reviewWeight = Math.max(reviewWeight, 0.1);

      let flagged = false;

      if (interactionCount > REPEATED_INTERACTION_THRESHOLD) {
        reviewWeight *= 0.65;
        flagged = true;
      }

      if (reviewerAgeDays < NEW_ACCOUNT_DAYS) {
        reviewWeight *= 0.55;
        flagged = true;
      }

      if (diversityCount < LOW_DIVERSITY_THRESHOLD) {
        reviewWeight *= 0.75;
        flagged = true;
      }

      if (flagged) {
        flaggedReviewCount += 1;
      }

      if (reviewerAgeDays < NEW_ACCOUNT_DAYS || diversityCount < LOW_DIVERSITY_THRESHOLD) {
        lowTrustReviewCount += 1;
      }

      weightedRatingSum += review.rating * reviewWeight;
      weightedReviewCount += reviewWeight;

      if (review.rating <= 2) {
        disputeCount += 1;
      }
    }

    const avgRating = weightedReviewCount > 0 ? weightedRatingSum / weightedReviewCount : 0;
    const avgRatingNormalized = clamp01(avgRating / 5);
    const completionRate = allJobCount > 0 ? jobsCompleted / allJobCount : 0;
    const repeatClientsRatio = jobsCompleted > 0 ? repeatClients / jobsCompleted : 0;
    const disputeRatio = jobsCompleted > 0 ? disputeCount / jobsCompleted : 0;
    const disputePenalty = 1 - clamp01(disputeRatio);
    const weightedBaseScore =
      completionRate * 0.4 +
      avgRatingNormalized * 0.3 +
      repeatClientsRatio * 0.2 +
      disputePenalty * 0.1;
    const jobsFactor = Math.log(jobsCompleted + 1);
    const jobsFactorNormalized = jobsCompleted > 0 ? clamp01(jobsFactor / JOB_FACTOR_CAP) : 0;
    const stabilityFactor = 0.6 + jobsFactorNormalized * 0.4;
    const declaredLevelSupport =
      getDeclaredLevelSignal(declaredLevel) * (jobsCompleted > 0 || verifiedProofCount > 0 ? 0.03 : 0.08);
    const proofBonus = Math.min(MAX_PROOF_BONUS, verifiedProofCount * PROOF_BONUS_PER_VERIFIED);
    const experienceScore = clamp01(weightedBaseScore * stabilityFactor + declaredLevelSupport + proofBonus);
    const experienceMultiplier = 1 + experienceScore * 0.3;
    const badge = getCredibilityBadge(experienceScore, verifiedProofCount, disputeCount);

    const record = persist
      ? await db.userSkillExperience.upsert({
          where: {
            userId_occupationId: {
              userId,
              occupationId,
            },
          },
          create: {
            userId,
            occupationId,
            declaredLevel,
            experienceScore: round(experienceScore),
            jobsCompleted,
            avgRating: round(avgRating, 2),
            repeatClients,
            disputeCount,
          },
          update: {
            experienceScore: round(experienceScore),
            jobsCompleted,
            avgRating: round(avgRating, 2),
            repeatClients,
            disputeCount,
          },
        })
      : existingExperience;

    return {
      occupationTitle: occupation?.title ?? null,
      occupationCode: occupation?.ncoCode ?? null,
      declaredLevel: normalizeDeclaredLevel(record?.declaredLevel ?? declaredLevel),
      experienceScore: round(experienceScore),
      experienceMultiplier: round(experienceMultiplier),
      credibilityScore: Math.round(experienceScore * 100),
      jobsCompleted,
      avgRating: round(avgRating, 2),
      repeatClients,
      disputeCount,
      badge,
      verifiedProofCount,
      completionRate: round(completionRate),
      avgRatingNormalized: round(avgRatingNormalized),
      repeatClientsRatio: round(repeatClientsRatio),
      disputeRatio: round(disputeRatio),
      disputePenalty: round(disputePenalty),
      weightedBaseScore: round(weightedBaseScore),
      jobsFactor: round(jobsFactor),
      jobsFactorNormalized: round(jobsFactorNormalized),
      declaredLevelSupport: round(declaredLevelSupport),
      proofBonus: round(proofBonus),
      finalScore: round(experienceScore),
      weightedReviewCount: round(weightedReviewCount, 2),
      flaggedReviewCount,
      lowTrustReviewCount,
      verifiedProofs: verifiedProofCount,
    };
  }

  async getExperienceMultiplier(userId: string, occupationId?: string | null): Promise<{
    experienceScore: number;
    experienceMultiplier: number;
  }> {
    if (!occupationId) {
      return {
        experienceScore: 0,
        experienceMultiplier: 1,
      };
    }

    const breakdown = await this.calculateExperienceScore(userId, occupationId, prisma, false);
    return {
      experienceScore: breakdown.experienceScore,
      experienceMultiplier: breakdown.experienceMultiplier,
    };
  }

  private async summarizeProofVotes(
    db: DbClient,
    proofId: string,
    occupationId: string
  ): Promise<ProofVoteSummary> {
    const votes = await db.proofVote.findMany({
      where: { proofId },
      select: {
        voteType: true,
        voterId: true,
      },
    });

    const voterIds = Array.from(new Set(votes.map((vote) => vote.voterId)));
    const voterExperienceMap = await getVoterExperienceMap(db, voterIds, occupationId);

    let validVotes = 0;
    let fakeVotes = 0;
    let irrelevantVotes = 0;
    let positiveWeight = 0;
    let negativeWeight = 0;
    let totalWeight = 0;

    for (const vote of votes) {
      const voteWeight = Math.max(
        clamp01(voterExperienceMap.get(vote.voterId) ?? DEFAULT_VOTER_EXPERIENCE),
        0.1
      );

      totalWeight += voteWeight;

      if (vote.voteType === ProofVoteType.VALID) {
        validVotes += 1;
        positiveWeight += voteWeight;
      } else if (vote.voteType === ProofVoteType.FAKE) {
        fakeVotes += 1;
        negativeWeight += voteWeight;
      } else {
        irrelevantVotes += 1;
      }
    }

    const proofScore = totalWeight > 0 ? (positiveWeight - negativeWeight) / totalWeight : 0;
    const isVerified = totalWeight >= MIN_PROOF_WEIGHT && proofScore > PROOF_VERIFICATION_THRESHOLD;

    return {
      validVotes,
      fakeVotes,
      irrelevantVotes,
      proofScore: round(proofScore),
      totalWeight: round(totalWeight, 2),
      isVerified,
    };
  }

  async recomputeProofVerification(proofId: string, db: DbClient = prisma): Promise<ProofVoteSummary | null> {
    const proof = await db.userSkillProof.findUnique({
      where: { id: proofId },
      select: {
        id: true,
        occupationId: true,
      },
    });

    if (!proof) {
      return null;
    }

    const summary = await this.summarizeProofVotes(db, proofId, proof.occupationId);

    await db.userSkillProof.update({
      where: { id: proofId },
      data: {
        isVerified: summary.isVerified,
      },
    });

    return summary;
  }

  async createProof(input: CreateProofInput): Promise<ProofSummary> {
    const { userId, occupationId, proofType, proofUrl, description, declaredLevel } = input;

    const [user, occupation] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.occupation.findUnique({ where: { id: occupationId }, select: { id: true } }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!occupation) {
      throw new AppError('Occupation not found', 404);
    }

    const proof = await prisma.$transaction(async (tx) => {
      if (declaredLevel) {
        await this.setDeclaredLevel(userId, occupationId, declaredLevel, tx);
      }

      const createdProof = await tx.userSkillProof.create({
        data: {
          userId,
          occupationId,
          proofType,
          proofUrl,
          description: description?.trim() || null,
        },
      });

      await this.logEvent({
        userId,
        occupationId,
        eventType: CredibilityEventType.PROOF_ADDED,
        metadata: {
          proofId: createdProof.id,
          proofType: normalizeProofType(proofType),
        },
        db: tx,
      });

      await this.calculateExperienceScore(userId, occupationId, tx);

      return createdProof;
    });

    return {
      id: proof.id,
      proofType: normalizeProofType(proof.proofType),
      proofUrl: proof.proofUrl,
      description: proof.description,
      isVerified: proof.isVerified,
      createdAt: proof.createdAt,
      votes: {
        validVotes: 0,
        fakeVotes: 0,
        irrelevantVotes: 0,
        proofScore: 0,
        totalWeight: 0,
        isVerified: false,
      },
    };
  }

  async voteOnProof(input: ProofVoteInput): Promise<ProofSummary> {
    const { proofId, voterId, voteType } = input;

    const proof = await prisma.userSkillProof.findUnique({
      where: { id: proofId },
      select: {
        id: true,
        userId: true,
        occupationId: true,
        proofType: true,
        proofUrl: true,
        description: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!proof) {
      throw new AppError('Proof not found', 404);
    }

    if (proof.userId === voterId) {
      throw new AppError('You cannot vote on your own proof', 400);
    }

    const summary = await prisma.$transaction(async (tx) => {
      await tx.proofVote.upsert({
        where: {
          proofId_voterId: {
            proofId,
            voterId,
          },
        },
        create: {
          proofId,
          voterId,
          voteType,
        },
        update: {
          voteType,
        },
      });

      const voteSummary = await this.recomputeProofVerification(proofId, tx);
      await this.calculateExperienceScore(proof.userId, proof.occupationId, tx);

      return voteSummary;
    });

    if (!summary) {
      throw new AppError('Unable to process proof vote', 500);
    }

    return {
      id: proof.id,
      proofType: normalizeProofType(proof.proofType),
      proofUrl: proof.proofUrl,
      description: proof.description,
      isVerified: summary.isVerified,
      createdAt: proof.createdAt,
      votes: summary,
    };
  }

  async getUserOccupationCredibility(userId: string, occupationId: string): Promise<{
    userId: string;
    occupationId: string;
    occupationTitle: string | null;
    occupationCode: string | null;
    declaredLevel: 'beginner' | 'intermediate' | 'expert';
    experienceScore: number;
    credibilityScore: number;
    experienceMultiplier: number;
    jobsCompleted: number;
    avgRating: number;
    repeatClients: number;
    disputeCount: number;
    verifiedProofs: number;
    badge: string;
    breakdown: ExperienceScoreBreakdown;
    proofs: ProofSummary[];
    recentEvents: Array<{
      id: string;
      eventType: string;
      metadata: Prisma.JsonValue;
      createdAt: Date;
    }>;
  }> {
    const credibility = await this.calculateExperienceScore(userId, occupationId);
    const proofs = await prisma.userSkillProof.findMany({
      where: {
        userId,
        occupationId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        proofType: true,
        proofUrl: true,
        description: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const proofSummaries = await Promise.all(
      proofs.map(async (proof) => {
        const voteSummary = await this.summarizeProofVotes(prisma, proof.id, occupationId);

        return {
          id: proof.id,
          proofType: normalizeProofType(proof.proofType),
          proofUrl: proof.proofUrl,
          description: proof.description,
          isVerified: voteSummary.isVerified,
          createdAt: proof.createdAt,
          votes: voteSummary,
        };
      })
    );

    const recentEvents = await prisma.credibilityEvent.findMany({
      where: {
        userId,
        occupationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        metadata: true,
        createdAt: true,
      },
    });

    return {
      userId,
      occupationId,
      occupationTitle: credibility.occupationTitle,
      occupationCode: credibility.occupationCode,
      declaredLevel: credibility.declaredLevel,
      experienceScore: credibility.experienceScore,
      credibilityScore: credibility.credibilityScore,
      experienceMultiplier: credibility.experienceMultiplier,
      jobsCompleted: credibility.jobsCompleted,
      avgRating: credibility.avgRating,
      repeatClients: credibility.repeatClients,
      disputeCount: credibility.disputeCount,
      verifiedProofs: credibility.verifiedProofCount,
      badge: credibility.badge,
      breakdown: {
        completionRate: credibility.completionRate,
        avgRating: credibility.avgRating,
        avgRatingNormalized: credibility.avgRatingNormalized,
        repeatClientsRatio: credibility.repeatClientsRatio,
        disputeRatio: credibility.disputeRatio,
        disputePenalty: credibility.disputePenalty,
        weightedBaseScore: credibility.weightedBaseScore,
        jobsFactor: credibility.jobsFactor,
        jobsFactorNormalized: credibility.jobsFactorNormalized,
        declaredLevelSupport: credibility.declaredLevelSupport,
        proofBonus: credibility.proofBonus,
        finalScore: credibility.finalScore,
        weightedReviewCount: credibility.weightedReviewCount,
        flaggedReviewCount: credibility.flaggedReviewCount,
        lowTrustReviewCount: credibility.lowTrustReviewCount,
        verifiedProofs: credibility.verifiedProofs,
      },
      proofs: proofSummaries,
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        eventType: String(event.eventType).toLowerCase(),
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
    };
  }

  async getUserCredibilityOverview(userId: string): Promise<OccupationCredibilitySummary[]> {
    const [experienceRows, services, proofs] = await Promise.all([
      prisma.userSkillExperience.findMany({
        where: { userId },
        select: { occupationId: true },
      }),
      prisma.service.findMany({
        where: {
          userId,
          occupationId: { not: null },
        },
        select: { occupationId: true },
      }),
      prisma.userSkillProof.findMany({
        where: { userId },
        select: { occupationId: true },
      }),
    ]);

    const occupationIds = Array.from(
      new Set(
        [...experienceRows, ...services, ...proofs]
          .map((item) => item.occupationId)
          .filter((occupationId): occupationId is string => Boolean(occupationId))
      )
    );

    const credibilityRows = await Promise.all(
      occupationIds.map(async (occupationId) => ({
        occupationId,
        credibility: await this.calculateExperienceScore(userId, occupationId),
      }))
    );

    return credibilityRows
      .filter(
        (
          row
        ): row is {
          occupationId: string;
          credibility: CredibilityBreakdown & { occupationTitle: string; occupationCode: string };
        } => Boolean(row.credibility.occupationTitle && row.credibility.occupationCode)
      )
      .sort((a, b) => b.credibility.experienceScore - a.credibility.experienceScore)
      .map(({ occupationId, credibility }) => ({
        occupationId,
        occupationTitle: credibility.occupationTitle,
        occupationCode: credibility.occupationCode,
        declaredLevel: credibility.declaredLevel,
        experienceScore: credibility.experienceScore,
        credibilityScore: credibility.credibilityScore,
        experienceMultiplier: credibility.experienceMultiplier,
        jobsCompleted: credibility.jobsCompleted,
        avgRating: credibility.avgRating,
        repeatClients: credibility.repeatClients,
        disputeCount: credibility.disputeCount,
        verifiedProofs: credibility.verifiedProofCount,
        badge: credibility.badge,
      }));
  }
}

export const credibilityService = new CredibilityService();
export default credibilityService;
