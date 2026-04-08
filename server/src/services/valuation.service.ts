/**
 * SkillValuationEngine
 *
 * Calculates credits earned for services based on:
 *   credits = hours × skill_multiplier × reputation_factor × demand_factor × experience_multiplier
 *
 * Where:
 *   skill_multiplier = base multiplier from occupation (1.0 - 1.8)
 *   reputation_factor = 1 + ((average_rating - 3) × 0.1)
 *   demand_factor = 1 + log(requests_last_30_days / providers_available), clamped to 1.5
 *   experience_multiplier = 1 + (experience_score × 0.3)
 *   total_multiplier = clamped to [1.0, tiered maximum]
 */

import prisma from '../utils/prisma';
import { credibilityService } from './credibility.service';

export interface ValuationInput {
  hours: number;
  occupationId?: string | null;
  providerId: string;
}

export interface ValuationBreakdown {
  hours: number;
  skillMultiplier: number;
  reputationFactor: number;
  demandFactor: number;
  experienceMultiplier: number;
  experienceScore: number;
  rawMultiplier: number;
  maxAllowedMultiplier: number;
  capTier: 'standard' | 'advanced' | 'professional' | 'elite';
  totalMultiplier: number;
  creditsEarned: number;
  occupationCode: string | null;
  occupationTitle: string | null;
  skillLevel: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface CreditEstimate {
  minCreditsPerHour: number;
  maxCreditsPerHour: number;
  skillMultiplier: number;
  skillLevel: number;
  occupationTitle: string | null;
  reputationFactor: number;
  demandFactor: number;
  experienceMultiplier: number;
  experienceScore: number;
  rawMultiplier: number;
  maxAllowedMultiplier: number;
  capTier: 'standard' | 'advanced' | 'professional' | 'elite';
  averageRating: number | null;
  reviewCount: number;
}

const MIN_TOTAL_MULTIPLIER = 1.0;
const MAX_DEMAND_FACTOR = 1.5;
const DEFAULT_SKILL_MULTIPLIER = 1.0;
const DEFAULT_REPUTATION_FACTOR = 1.0;
const DEFAULT_DEMAND_FACTOR = 1.0;
const DEFAULT_EXPERIENCE_MULTIPLIER = 1.0;
const STANDARD_CAP = 2.5;
const ADVANCED_CAP = 3.2;
const PROFESSIONAL_CAP = 3.4;
const ELITE_CAP = 4.0;
const ELITE_EXPERIENCE_THRESHOLD = 0.75;
const ELITE_REVIEW_COUNT_THRESHOLD = 5;

export function resolveMaxTotalMultiplier(
  skillLevel: number,
  experienceScore: number,
  reviewCount: number
): {
  maxAllowedMultiplier: number;
  capTier: 'standard' | 'advanced' | 'professional' | 'elite';
} {
  if (skillLevel >= 4) {
    if (
      experienceScore >= ELITE_EXPERIENCE_THRESHOLD &&
      reviewCount >= ELITE_REVIEW_COUNT_THRESHOLD
    ) {
      return { maxAllowedMultiplier: ELITE_CAP, capTier: 'elite' };
    }

    return { maxAllowedMultiplier: PROFESSIONAL_CAP, capTier: 'professional' };
  }

  if (skillLevel === 3) {
    return { maxAllowedMultiplier: ADVANCED_CAP, capTier: 'advanced' };
  }

  return { maxAllowedMultiplier: STANDARD_CAP, capTier: 'standard' };
}

class SkillValuationEngine {
  async calculateCredits(input: ValuationInput): Promise<ValuationBreakdown> {
    const { hours, occupationId, providerId } = input;

    const { skillMultiplier, occupationCode, occupationTitle, skillLevel } =
      await this.getSkillMultiplier(occupationId);

    const { reputationFactor, averageRating, reviewCount } =
      await this.getReputationFactor(providerId);

    const demandFactor = await this.getDemandFactor(occupationId);
    const { experienceMultiplier, experienceScore } =
      await credibilityService.getExperienceMultiplier(providerId, occupationId);

    const rawMultiplier =
      skillMultiplier * reputationFactor * demandFactor * experienceMultiplier;
    const { maxAllowedMultiplier, capTier } = resolveMaxTotalMultiplier(
      skillLevel,
      experienceScore,
      reviewCount
    );
    const totalMultiplier = Math.max(
      MIN_TOTAL_MULTIPLIER,
      Math.min(maxAllowedMultiplier, rawMultiplier)
    );

    const creditsEarned = parseFloat((hours * totalMultiplier).toFixed(2));

    return {
      hours,
      skillMultiplier: parseFloat(skillMultiplier.toFixed(4)),
      reputationFactor: parseFloat(reputationFactor.toFixed(4)),
      demandFactor: parseFloat(demandFactor.toFixed(4)),
      experienceMultiplier: parseFloat(experienceMultiplier.toFixed(4)),
      experienceScore: parseFloat(experienceScore.toFixed(4)),
      rawMultiplier: parseFloat(rawMultiplier.toFixed(4)),
      maxAllowedMultiplier: parseFloat(maxAllowedMultiplier.toFixed(4)),
      capTier,
      totalMultiplier: parseFloat(totalMultiplier.toFixed(4)),
      creditsEarned,
      occupationCode,
      occupationTitle,
      skillLevel,
      averageRating,
      reviewCount,
    };
  }

  async getEstimatedRate(
    occupationId?: string | null,
    providerId?: string | null
  ): Promise<CreditEstimate> {
    const { skillMultiplier, occupationTitle, skillLevel } =
      await this.getSkillMultiplier(occupationId);

    let reputationFactor = DEFAULT_REPUTATION_FACTOR;
    let averageRating: number | null = null;
    let reviewCount = 0;
    let experienceMultiplier = DEFAULT_EXPERIENCE_MULTIPLIER;
    let experienceScore = 0;

    if (providerId) {
      const repData = await this.getReputationFactor(providerId);
      reputationFactor = repData.reputationFactor;
      averageRating = repData.averageRating;
      reviewCount = repData.reviewCount;

      const experienceData = await credibilityService.getExperienceMultiplier(
        providerId,
        occupationId
      );
      experienceMultiplier = experienceData.experienceMultiplier;
      experienceScore = experienceData.experienceScore;
    }

    const demandFactor = await this.getDemandFactor(occupationId);
    const rawMultiplier =
      skillMultiplier * reputationFactor * demandFactor * experienceMultiplier;
    const { maxAllowedMultiplier, capTier } = resolveMaxTotalMultiplier(
      skillLevel,
      experienceScore,
      reviewCount
    );

    const minMultiplier = Math.max(
      MIN_TOTAL_MULTIPLIER,
      skillMultiplier * experienceMultiplier
    );
    const maxMultiplier = Math.min(
      maxAllowedMultiplier,
      rawMultiplier
    );

    return {
      minCreditsPerHour: parseFloat(
        Math.max(MIN_TOTAL_MULTIPLIER, minMultiplier).toFixed(2)
      ),
      maxCreditsPerHour: parseFloat(Math.max(minMultiplier, maxMultiplier).toFixed(2)),
      skillMultiplier: parseFloat(skillMultiplier.toFixed(4)),
      skillLevel,
      occupationTitle,
      reputationFactor: parseFloat(reputationFactor.toFixed(4)),
      demandFactor: parseFloat(demandFactor.toFixed(4)),
      experienceMultiplier: parseFloat(experienceMultiplier.toFixed(4)),
      experienceScore: parseFloat(experienceScore.toFixed(4)),
      rawMultiplier: parseFloat(rawMultiplier.toFixed(4)),
      maxAllowedMultiplier: parseFloat(maxAllowedMultiplier.toFixed(4)),
      capTier,
      averageRating,
      reviewCount,
    };
  }

  private async getSkillMultiplier(occupationId?: string | null): Promise<{
    skillMultiplier: number;
    occupationCode: string | null;
    occupationTitle: string | null;
    skillLevel: number;
  }> {
    if (!occupationId) {
      return {
        skillMultiplier: DEFAULT_SKILL_MULTIPLIER,
        occupationCode: null,
        occupationTitle: null,
        skillLevel: 1,
      };
    }

    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!occupation) {
      return {
        skillMultiplier: DEFAULT_SKILL_MULTIPLIER,
        occupationCode: null,
        occupationTitle: null,
        skillLevel: 1,
      };
    }

    return {
      skillMultiplier: occupation.baseMultiplier,
      occupationCode: occupation.ncoCode,
      occupationTitle: occupation.title,
      skillLevel: occupation.skillLevel,
    };
  }

  private async getReputationFactor(providerId: string): Promise<{
    reputationFactor: number;
    averageRating: number | null;
    reviewCount: number;
  }> {
    const reviews = await prisma.review.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = reviews._avg.rating;
    const reviewCount = reviews._count.rating;

    if (avgRating === null || reviewCount === 0) {
      return {
        reputationFactor: DEFAULT_REPUTATION_FACTOR,
        averageRating: null,
        reviewCount: 0,
      };
    }

    const reputationFactor = 1 + (avgRating - 3) * 0.1;

    return {
      reputationFactor: Math.max(0.8, reputationFactor),
      averageRating: parseFloat(avgRating.toFixed(2)),
      reviewCount,
    };
  }

  private async getDemandFactor(occupationId?: string | null): Promise<number> {
    if (!occupationId) {
      return DEFAULT_DEMAND_FACTOR;
    }

    const stats = await prisma.serviceStats.findUnique({
      where: { occupationId },
    });

    if (!stats || stats.providersAvailable === 0) {
      return DEFAULT_DEMAND_FACTOR;
    }

    const ratio = stats.requestsLast30Days / stats.providersAvailable;

    if (ratio <= 1) {
      return DEFAULT_DEMAND_FACTOR;
    }

    const demandFactor = 1 + Math.log(ratio);

    return Math.min(MAX_DEMAND_FACTOR, Math.max(DEFAULT_DEMAND_FACTOR, demandFactor));
  }
}

export const skillValuationEngine = new SkillValuationEngine();
export default skillValuationEngine;
