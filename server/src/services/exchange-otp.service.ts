import crypto from 'crypto';
import {
  CredibilityEventType,
  ExchangeStatus,
  OtpGeneratedFor,
  OtpPhase,
  Prisma,
  ServiceOtp,
} from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';
import { skillValuationEngine } from './valuation.service';
import { blockchainService } from './blockchain.service';
import { credibilityService } from './credibility.service';
import { lockConversationForExchange } from './chat.service';

const OTP_TTL_MINUTES = 5;
const MAX_GENERATION_ATTEMPTS = 3;
const MAX_VERIFY_ATTEMPTS = 3;
const MIN_VERIFIED_DURATION_MINUTES = 5;

type ExchangeWithRelations = Prisma.ExchangeGetPayload<{
  include: {
    provider: { select: { id: true; name: true; walletAddress: true } };
    requester: { select: { id: true; name: true; walletAddress: true } };
    service: { select: { id: true; occupationId: true; title: true } };
  };
}>;

type ParticipantRole = 'provider' | 'requester';
type PhaseKey = 'start' | 'completion';
type PhaseStatus = 'not_started' | 'pending' | 'expired' | 'verified';
type PhaseUserRole = 'generator' | 'verifier';
type FailedReason = 'invalid' | 'expired' | 'locked';

export interface OtpPhaseSummary {
  phase: PhaseKey;
  status: PhaseStatus;
  sessionId: string | null;
  createdAt: Date | null;
  expiresAt: Date | null;
  generatedFor: ParticipantRole;
  verifiedBy: ParticipantRole;
  currentUserRoleInPhase: PhaseUserRole;
  verified: boolean;
  verifiedAt: Date | null;
  failedAttempts: number;
  verifyAttemptsRemaining: number;
  generationCount: number;
  generationAttemptsRemaining: number;
  canGenerate: boolean;
  canVerify: boolean;
  isExpired: boolean;
}

export interface ExchangeOtpStatus {
  exchangeId: string;
  exchangeStatus: ExchangeStatus;
  currentUserRole: ParticipantRole;
  startedAt: Date | null;
  completedAt: Date | null;
  start: OtpPhaseSummary;
  completion: OtpPhaseSummary;
}

export interface OtpMutationResult {
  message: string;
  revealedOtp: string | null;
  exchange: {
    id: string;
    status: ExchangeStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    providerConfirmed: boolean;
    requesterConfirmed: boolean;
    blockchainTxHash: string | null;
  };
  otpStatus: ExchangeOtpStatus;
}

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function toPhaseKey(phase: OtpPhase): PhaseKey {
  return phase === OtpPhase.START ? 'start' : 'completion';
}

function getRole(exchange: ExchangeWithRelations, userId: string): ParticipantRole {
  if (exchange.providerId === userId) return 'provider';
  if (exchange.requesterId === userId) return 'requester';
  throw new AppError('Not authorized for this exchange', 403);
}

function getPhaseParticipants(phase: OtpPhase): {
  generator: ParticipantRole;
  verifier: ParticipantRole;
  requiredStatus: ExchangeStatus;
} {
  if (phase === OtpPhase.START) {
    return {
      generator: 'provider',
      verifier: 'requester',
      requiredStatus: ExchangeStatus.ACCEPTED,
    };
  }

  return {
    generator: 'requester',
    verifier: 'provider',
    requiredStatus: ExchangeStatus.ACTIVE,
  };
}

function toGeneratedFor(role: ParticipantRole): OtpGeneratedFor {
  return role === 'provider' ? OtpGeneratedFor.PROVIDER : OtpGeneratedFor.RECEIVER;
}

function generatedForToRole(generatedFor: OtpGeneratedFor): ParticipantRole {
  return generatedFor === OtpGeneratedFor.PROVIDER ? 'provider' : 'requester';
}

function hasExpired(session: ServiceOtp): boolean {
  return session.expiresAt.getTime() <= Date.now();
}

function isLocked(session: ServiceOtp): boolean {
  return Boolean(session.invalidatedAt && !session.verified);
}

function isUnavailable(session: ServiceOtp): boolean {
  return !session.verified && (hasExpired(session) || isLocked(session));
}

async function appendFailedAttempt(
  session: ServiceOtp,
  role: ParticipantRole,
  reason: FailedReason
): Promise<void> {
  const existingLog = Array.isArray(session.failedAttemptLog)
    ? (session.failedAttemptLog as Prisma.JsonArray)
    : [];

  const nextAttempts = session.failedAttempts + 1;

  await prisma.serviceOtp.update({
    where: { id: session.id },
    data: {
      failedAttempts: { increment: 1 },
      invalidatedAt: nextAttempts >= MAX_VERIFY_ATTEMPTS ? new Date() : session.invalidatedAt,
      failedAttemptLog: [
        ...existingLog,
        {
          role,
          reason,
          at: new Date().toISOString(),
        },
      ],
    },
  });
}

class ExchangeOtpService {
  private async getExchangeForUser(exchangeId: string, userId: string): Promise<{
    exchange: ExchangeWithRelations;
    role: ParticipantRole;
  }> {
    const exchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        provider: { select: { id: true, name: true, walletAddress: true } },
        requester: { select: { id: true, name: true, walletAddress: true } },
        service: { select: { id: true, occupationId: true, title: true } },
      },
    });

    if (!exchange) {
      throw new AppError('Exchange not found', 404);
    }

    const role = getRole(exchange, userId);
    return { exchange, role };
  }

  private async getLatestSession(exchangeId: string, phase: OtpPhase): Promise<ServiceOtp | null> {
    return prisma.serviceOtp.findFirst({
      where: { exchangeId, phase },
      orderBy: { createdAt: 'desc' },
    });
  }

  private summarizePhase(
    exchange: ExchangeWithRelations,
    role: ParticipantRole,
    phase: OtpPhase,
    generationCount: number,
    session: ServiceOtp | null
  ): OtpPhaseSummary {
    const { generator, verifier, requiredStatus } = getPhaseParticipants(phase);
    const currentUserRoleInPhase: PhaseUserRole = role === generator ? 'generator' : 'verifier';

    if (!session) {
      return {
        phase: toPhaseKey(phase),
        status: 'not_started',
        sessionId: null,
        createdAt: null,
        expiresAt: null,
        generatedFor: generator,
        verifiedBy: verifier,
        currentUserRoleInPhase,
        verified: false,
        verifiedAt: null,
        failedAttempts: 0,
        verifyAttemptsRemaining: MAX_VERIFY_ATTEMPTS,
        generationCount,
        generationAttemptsRemaining: Math.max(0, MAX_GENERATION_ATTEMPTS - generationCount),
        canGenerate:
          role === generator &&
          exchange.status === requiredStatus &&
          generationCount < MAX_GENERATION_ATTEMPTS,
        canVerify: false,
        isExpired: false,
      };
    }

    const expired = hasExpired(session);
    const status: PhaseStatus = session.verified ? 'verified' : isUnavailable(session) ? 'expired' : 'pending';

    return {
      phase: toPhaseKey(phase),
      status,
      sessionId: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      generatedFor: generatedForToRole(session.generatedFor),
      verifiedBy: verifier,
      currentUserRoleInPhase,
      verified: session.verified,
      verifiedAt: session.verifiedAt,
      failedAttempts: session.failedAttempts,
      verifyAttemptsRemaining: Math.max(0, MAX_VERIFY_ATTEMPTS - session.failedAttempts),
      generationCount,
      generationAttemptsRemaining: Math.max(0, MAX_GENERATION_ATTEMPTS - generationCount),
      canGenerate:
        role === generator &&
        exchange.status === requiredStatus &&
        generationCount < MAX_GENERATION_ATTEMPTS &&
        (session.verified || isUnavailable(session)),
      canVerify:
        role === verifier &&
        exchange.status === requiredStatus &&
        !session.verified &&
        !isUnavailable(session) &&
        session.failedAttempts < MAX_VERIFY_ATTEMPTS,
      isExpired: expired,
    };
  }

  async getOtpStatus(exchangeId: string, userId: string): Promise<ExchangeOtpStatus> {
    const { exchange, role } = await this.getExchangeForUser(exchangeId, userId);

    const [startCount, completionCount, latestStart, latestCompletion] = await Promise.all([
      prisma.serviceOtp.count({ where: { exchangeId, phase: OtpPhase.START } }),
      prisma.serviceOtp.count({ where: { exchangeId, phase: OtpPhase.COMPLETION } }),
      this.getLatestSession(exchangeId, OtpPhase.START),
      this.getLatestSession(exchangeId, OtpPhase.COMPLETION),
    ]);

    return {
      exchangeId: exchange.id,
      exchangeStatus: exchange.status,
      currentUserRole: role,
      startedAt: exchange.startedAt,
      completedAt: exchange.completedAt,
      start: this.summarizePhase(exchange, role, OtpPhase.START, startCount, latestStart),
      completion: this.summarizePhase(
        exchange,
        role,
        OtpPhase.COMPLETION,
        completionCount,
        latestCompletion
      ),
    };
  }

  private assertGenerationAllowed(
    exchange: ExchangeWithRelations,
    role: ParticipantRole,
    phase: OtpPhase
  ) {
    const { generator, requiredStatus } = getPhaseParticipants(phase);

    if (role !== generator) {
      if (phase === OtpPhase.START) {
        throw new AppError('Only the provider can generate the start OTP', 403);
      }

      throw new AppError('Only the receiver can generate the completion OTP', 403);
    }

    if (exchange.status !== requiredStatus) {
      if (phase === OtpPhase.START) {
        throw new AppError('Start OTPs can only be generated for accepted exchanges', 400);
      }

      throw new AppError('Completion OTPs can only be generated while the exchange is in progress', 400);
    }
  }

  async generatePhaseOtps(
    exchangeId: string,
    userId: string,
    phase: OtpPhase
  ): Promise<OtpMutationResult> {
    const { exchange, role } = await this.getExchangeForUser(exchangeId, userId);
    this.assertGenerationAllowed(exchange, role, phase);

    const [generationCount, latest] = await Promise.all([
      prisma.serviceOtp.count({ where: { exchangeId, phase } }),
      this.getLatestSession(exchangeId, phase),
    ]);

    if (latest && !latest.verified && !isUnavailable(latest)) {
      return {
        message:
          phase === OtpPhase.START
            ? 'A start OTP is already active. Ask the receiver to enter it before it expires.'
            : 'A completion OTP is already active. Ask the provider to enter it before it expires.',
        revealedOtp: null,
        exchange: {
          id: exchange.id,
          status: exchange.status,
          startedAt: exchange.startedAt,
          completedAt: exchange.completedAt,
          providerConfirmed: exchange.providerConfirmed,
          requesterConfirmed: exchange.requesterConfirmed,
          blockchainTxHash: exchange.blockchainTxHash,
        },
        otpStatus: await this.getOtpStatus(exchangeId, userId),
      };
    }

    if (generationCount >= MAX_GENERATION_ATTEMPTS) {
      throw new AppError('OTP generation limit reached for this phase', 429);
    }

    const otp = generateOtp();

    await prisma.serviceOtp.create({
      data: {
        exchangeId,
        phase,
        otpHash: hashOtp(otp),
        generatedFor: toGeneratedFor(role),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        failedAttemptLog: [],
      },
    });

    return {
      message:
        phase === OtpPhase.START
          ? 'Start OTP generated. Share it with the receiver.'
          : 'Completion OTP generated. Share it with the provider.',
      revealedOtp: otp,
      exchange: {
        id: exchange.id,
        status: exchange.status,
        startedAt: exchange.startedAt,
        completedAt: exchange.completedAt,
        providerConfirmed: exchange.providerConfirmed,
        requesterConfirmed: exchange.requesterConfirmed,
        blockchainTxHash: exchange.blockchainTxHash,
      },
      otpStatus: await this.getOtpStatus(exchangeId, userId),
    };
  }

  private assertVerificationAllowed(
    exchange: ExchangeWithRelations,
    role: ParticipantRole,
    phase: OtpPhase
  ) {
    const { verifier, requiredStatus } = getPhaseParticipants(phase);

    if (role !== verifier) {
      if (phase === OtpPhase.START) {
        throw new AppError('Only the receiver can verify the start OTP', 403);
      }

      throw new AppError('Only the provider can verify the completion OTP', 403);
    }

    if (exchange.status !== requiredStatus) {
      if (phase === OtpPhase.START) {
        throw new AppError('Start OTP verification is only available for accepted exchanges', 400);
      }

      throw new AppError('Completion OTP verification is only available for active exchanges', 400);
    }
  }

  async verifyPhaseOtp(
    exchangeId: string,
    userId: string,
    phase: OtpPhase,
    otp: string
  ): Promise<OtpMutationResult> {
    const { exchange, role } = await this.getExchangeForUser(exchangeId, userId);
    this.assertVerificationAllowed(exchange, role, phase);

    const latest = await this.getLatestSession(exchangeId, phase);
    if (!latest) {
      throw new AppError('No OTP has been generated for this phase yet.', 404);
    }

    if (latest.verified) {
      return {
        message: 'This OTP phase is already verified.',
        revealedOtp: null,
        exchange: {
          id: exchange.id,
          status: exchange.status,
          startedAt: exchange.startedAt,
          completedAt: exchange.completedAt,
          providerConfirmed: exchange.providerConfirmed,
          requesterConfirmed: exchange.requesterConfirmed,
          blockchainTxHash: exchange.blockchainTxHash,
        },
        otpStatus: await this.getOtpStatus(exchangeId, userId),
      };
    }

    if (hasExpired(latest)) {
      await appendFailedAttempt(latest, role, 'expired');
      throw new AppError('OTP expired. Ask for a fresh OTP and try again.', 400);
    }

    if (isLocked(latest) || latest.failedAttempts >= MAX_VERIFY_ATTEMPTS) {
      throw new AppError('Too many invalid OTP attempts. Generate a new OTP.', 429);
    }

    if (hashOtp(otp.trim()) !== latest.otpHash) {
      await appendFailedAttempt(latest, role, 'invalid');
      const remainingAttempts = Math.max(0, MAX_VERIFY_ATTEMPTS - latest.failedAttempts - 1);
      throw new AppError(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
          : 'Too many invalid OTP attempts. Generate a new OTP.',
        remainingAttempts > 0 ? 400 : 429
      );
    }

    const verificationTime = new Date();
    await prisma.serviceOtp.update({
      where: { id: latest.id },
      data: {
        verified: true,
        verifiedAt: verificationTime,
        invalidatedAt: verificationTime,
      },
    });

    let refreshedExchange: ExchangeWithRelations;

    if (phase === OtpPhase.START) {
      refreshedExchange = await prisma.exchange.update({
        where: { id: exchangeId },
        data: {
          status: ExchangeStatus.ACTIVE,
          startedAt: exchange.startedAt ?? verificationTime,
        },
        include: {
          provider: { select: { id: true, name: true, walletAddress: true } },
          requester: { select: { id: true, name: true, walletAddress: true } },
          service: { select: { id: true, occupationId: true, title: true } },
        },
      });
    } else {
      refreshedExchange = await this.completeExchange(exchangeId, verificationTime);
    }

    return {
      message:
        phase === OtpPhase.START
          ? 'Start OTP verified. The service is now in progress.'
          : 'Completion OTP verified. The exchange is complete.',
      revealedOtp: null,
      exchange: {
        id: refreshedExchange.id,
        status: refreshedExchange.status,
        startedAt: refreshedExchange.startedAt,
        completedAt: refreshedExchange.completedAt,
        providerConfirmed: refreshedExchange.providerConfirmed,
        requesterConfirmed: refreshedExchange.requesterConfirmed,
        blockchainTxHash: refreshedExchange.blockchainTxHash,
      },
      otpStatus: await this.getOtpStatus(exchangeId, userId),
    };
  }

  private async completeExchange(
    exchangeId: string,
    completionTime: Date
  ): Promise<ExchangeWithRelations> {
    const existingExchange = await prisma.exchange.findUnique({
      where: { id: exchangeId },
      include: {
        provider: { select: { id: true, name: true, walletAddress: true } },
        requester: { select: { id: true, name: true, walletAddress: true } },
        service: { select: { id: true, occupationId: true, title: true } },
      },
    });

    if (!existingExchange) {
      throw new AppError('Exchange not found', 404);
    }

    const occupationId = existingExchange.service?.occupationId ?? null;
    const verifiedDurationMinutes = existingExchange.startedAt
      ? (completionTime.getTime() - existingExchange.startedAt.getTime()) / (1000 * 60)
      : null;
    const durationFlag =
      verifiedDurationMinutes !== null && verifiedDurationMinutes < MIN_VERIFIED_DURATION_MINUTES;

    const updateData: Prisma.ExchangeUpdateInput = {
      status: ExchangeStatus.COMPLETED,
      providerConfirmed: true,
      requesterConfirmed: true,
      completedAt: completionTime,
    };

    try {
      const valuation = await skillValuationEngine.calculateCredits({
        hours: existingExchange.hours,
        occupationId,
        providerId: existingExchange.providerId,
      });

      updateData.creditsEarned = valuation.creditsEarned;
      updateData.occupationCode = valuation.occupationCode;
      updateData.valuationDetails = {
        skillMultiplier: valuation.skillMultiplier,
        reputationFactor: valuation.reputationFactor,
        demandFactor: valuation.demandFactor,
        experienceMultiplier: valuation.experienceMultiplier,
        experienceScore: valuation.experienceScore,
        rawMultiplier: valuation.rawMultiplier,
        maxAllowedMultiplier: valuation.maxAllowedMultiplier,
        capTier: valuation.capTier,
        totalMultiplier: valuation.totalMultiplier,
        occupationTitle: valuation.occupationTitle,
        skillLevel: valuation.skillLevel,
        verifiedDurationMinutes,
        flaggedShortDuration: durationFlag,
      };
    } catch (valuationError) {
      console.error('Valuation error, falling back to 1:1:', valuationError);
      updateData.creditsEarned = existingExchange.hours;
    }

    let exchange = await prisma.exchange.update({
      where: { id: exchangeId },
      data: updateData,
      include: {
        provider: { select: { id: true, name: true, walletAddress: true } },
        requester: { select: { id: true, name: true, walletAddress: true } },
        service: { select: { id: true, occupationId: true, title: true } },
      },
    });

    const providerWallet = exchange.provider.walletAddress;
    const requesterWallet = exchange.requester.walletAddress;

    if (providerWallet && requesterWallet) {
      try {
        const txHash = await blockchainService.recordServiceTransaction({
          providerWallet,
          receiverWallet: requesterWallet,
          hours: exchange.hours,
          credits: exchange.creditsEarned || exchange.hours,
          occupationCode: exchange.occupationCode || 'default',
        });

        if (txHash) {
          exchange = await prisma.exchange.update({
            where: { id: exchange.id },
            data: { blockchainTxHash: txHash },
            include: {
              provider: { select: { id: true, name: true, walletAddress: true } },
              requester: { select: { id: true, name: true, walletAddress: true } },
              service: { select: { id: true, occupationId: true, title: true } },
            },
          });
        }
      } catch (bcError) {
        console.error('Blockchain logging failed but keeping internal tx completed:', bcError);
      }
    }

    if (occupationId) {
      await credibilityService.logEvent({
        userId: exchange.providerId,
        occupationId,
        eventType: CredibilityEventType.JOB_COMPLETED,
        metadata: {
          exchangeId: exchange.id,
          requesterId: exchange.requesterId,
          hours: exchange.hours,
          creditsEarned: exchange.creditsEarned ?? exchange.hours,
          otpVerifiedStartAt: exchange.startedAt?.toISOString() ?? null,
          otpVerifiedCompletionAt: exchange.completedAt?.toISOString() ?? null,
          verifiedDurationMinutes,
          flaggedShortDuration: durationFlag,
        },
      });

      await credibilityService.calculateExperienceScore(exchange.providerId, occupationId);
    }

    await lockConversationForExchange(exchange.id);

    return exchange;
  }
}

export const exchangeOtpService = new ExchangeOtpService();
