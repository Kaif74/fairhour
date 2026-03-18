/**
 * SkillValuationEngine
 *
 * Calculates credits earned for services based on:
 *   credits = hours × skill_multiplier × reputation_factor × demand_factor
 *
 * Where:
 *   skill_multiplier = base_multiplier from occupation (1.0 – 1.8)
 *   reputation_factor = 1 + ((average_rating − 3) × 0.1)
 *   demand_factor = 1 + log(requests_last_30_days / providers_available), clamped ≤ 1.5
 *   total_multiplier = clamped to [1.0, 2.5]
 */

import prisma from '../utils/prisma';

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
    averageRating: number | null;
    reviewCount: number;
}

// Constants
const MIN_TOTAL_MULTIPLIER = 1.0;
const MAX_TOTAL_MULTIPLIER = 2.5;
const MAX_DEMAND_FACTOR = 1.5;
const DEFAULT_SKILL_MULTIPLIER = 1.0;
const DEFAULT_REPUTATION_FACTOR = 1.0;
const DEFAULT_DEMAND_FACTOR = 1.0;

// Trust dampening constants — new providers must prove themselves
const DEFAULT_TRUST_FACTOR_NEW = 0.5; // New providers get 50% of skill bonus
const TRUST_TIER_MID = 1;             // 1-2 completed exchanges → 70%
const TRUST_TIER_HIGH = 3;            // 3-4 completed exchanges → 85%
const TRUST_TIER_FULL = 5;            // 5+ completed exchanges → 100%
const TRUST_POOR_RATING_CAP = 0.6;    // Cap for providers with avg rating < 3.0

class SkillValuationEngine {
    /**
     * Calculate credits earned for a completed exchange.
     */
    async calculateCredits(input: ValuationInput): Promise<ValuationBreakdown> {
        const { hours, occupationId, providerId } = input;

        // 1. Fetch occupation multiplier
        const { skillMultiplier, occupationCode, occupationTitle, skillLevel } =
            await this.getSkillMultiplier(occupationId);

        // 2. Compute provider reputation
        const { reputationFactor, averageRating, reviewCount } =
            await this.getReputationFactor(providerId);

        // 3. Compute demand metrics
        const demandFactor = await this.getDemandFactor(occupationId);

        // 4. Compute trust factor (dampens skill multiplier for unproven providers)
        const trustFactor = await this.getTrustFactor(providerId);
        const effectiveSkillMultiplier = 1 + (skillMultiplier - 1) * trustFactor;

        // 5. Calculate total multiplier (clamped)
        const rawMultiplier = effectiveSkillMultiplier * reputationFactor * demandFactor;
        const totalMultiplier = Math.max(
            MIN_TOTAL_MULTIPLIER,
            Math.min(MAX_TOTAL_MULTIPLIER, rawMultiplier)
        );

        // 6. Calculate final credits
        const creditsEarned = parseFloat((hours * totalMultiplier).toFixed(2));

        return {
            hours,
            skillMultiplier: parseFloat(effectiveSkillMultiplier.toFixed(4)),
            reputationFactor: parseFloat(reputationFactor.toFixed(4)),
            demandFactor: parseFloat(demandFactor.toFixed(4)),
            totalMultiplier: parseFloat(totalMultiplier.toFixed(4)),
            creditsEarned,
            occupationCode,
            occupationTitle,
            skillLevel,
            averageRating,
            reviewCount,
        };
    }

    /**
     * Get an estimated credit rate range per hour (for display purposes).
     */
    async getEstimatedRate(
        occupationId?: string | null,
        providerId?: string | null
    ): Promise<CreditEstimate> {
        const { skillMultiplier, occupationTitle, skillLevel } =
            await this.getSkillMultiplier(occupationId);

        let reputationFactor = DEFAULT_REPUTATION_FACTOR;
        let averageRating: number | null = null;
        let reviewCount = 0;
        let trustFactor = DEFAULT_TRUST_FACTOR_NEW;

        if (providerId) {
            const repData = await this.getReputationFactor(providerId);
            reputationFactor = repData.reputationFactor;
            averageRating = repData.averageRating;
            reviewCount = repData.reviewCount;
            trustFactor = await this.getTrustFactor(providerId);
        }

        const demandFactor = await this.getDemandFactor(occupationId);

        // Apply trust dampening to skill multiplier
        const effectiveSkillMultiplier = 1 + (skillMultiplier - 1) * trustFactor;

        // Calculate min (without demand/reputation boost) and max
        const minMultiplier = Math.max(MIN_TOTAL_MULTIPLIER, effectiveSkillMultiplier);
        const maxMultiplier = Math.min(
            MAX_TOTAL_MULTIPLIER,
            effectiveSkillMultiplier * reputationFactor * demandFactor
        );

        return {
            minCreditsPerHour: parseFloat(Math.max(MIN_TOTAL_MULTIPLIER, minMultiplier).toFixed(2)),
            maxCreditsPerHour: parseFloat(Math.max(minMultiplier, maxMultiplier).toFixed(2)),
            skillMultiplier: parseFloat(effectiveSkillMultiplier.toFixed(4)),
            skillLevel,
            occupationTitle,
            reputationFactor: parseFloat(reputationFactor.toFixed(4)),
            demandFactor: parseFloat(demandFactor.toFixed(4)),
            averageRating,
            reviewCount,
        };
    }

    /**
     * Fetch the skill multiplier from the occupation table.
     */
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

    /**
     * Compute the reputation factor from provider's review history.
     * Formula: 1 + ((average_rating - 3) × 0.1)
     * Defaults to 1.0 for providers with no reviews.
     */
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

        // reputation_factor = 1 + ((average_rating − 3) × 0.1)
        const reputationFactor = 1 + (avgRating - 3) * 0.1;

        return {
            reputationFactor: Math.max(0.8, reputationFactor), // Floor at 0.8
            averageRating: parseFloat(avgRating.toFixed(2)),
            reviewCount,
        };
    }

    /**
     * Compute the demand factor from service stats.
     * Formula: 1 + log(requests_last_30_days / providers_available)
     * Clamped to maximum of 1.5.
     */
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

        // demand_factor = 1 + log(ratio), clamped to max 1.5
        const demandFactor = 1 + Math.log(ratio);

        return Math.min(MAX_DEMAND_FACTOR, Math.max(DEFAULT_DEMAND_FACTOR, demandFactor));
    }

    /**
     * Compute trust factor based on provider's track record.
     * New/unproven providers get dampened skill multipliers that unlock
     * as they complete exchanges and earn positive reviews.
     *
     * Trust tiers:
     *   0 completed exchanges  → 0.5 (only 50% of skill bonus)
     *   1-2 exchanges          → 0.7
     *   3-4 exchanges          → 0.85
     *   5+ exchanges           → 1.0 (full skill bonus unlocked)
     *
     * Penalty: if avg rating < 3.0 after 3+ reviews → capped at 0.6
     */
    private async getTrustFactor(providerId: string): Promise<number> {
        // Count completed exchanges where this user was the provider
        const completedExchanges = await prisma.exchange.count({
            where: {
                providerId,
                status: 'COMPLETED',
            },
        });

        // Determine base trust tier from exchange count
        let trustFactor: number;
        if (completedExchanges >= TRUST_TIER_FULL) {
            trustFactor = 1.0;
        } else if (completedExchanges >= TRUST_TIER_HIGH) {
            trustFactor = 0.85;
        } else if (completedExchanges >= TRUST_TIER_MID) {
            trustFactor = 0.7;
        } else {
            trustFactor = DEFAULT_TRUST_FACTOR_NEW;
        }

        // Penalty: poor ratings after enough reviews cap the trust
        const reviews = await prisma.review.aggregate({
            where: { providerId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        if (
            reviews._count.rating >= 3 &&
            reviews._avg.rating !== null &&
            reviews._avg.rating < 3.0
        ) {
            trustFactor = Math.min(trustFactor, TRUST_POOR_RATING_CAP);
        }

        return trustFactor;
    }
}

// Export singleton instance
export const skillValuationEngine = new SkillValuationEngine();
export default skillValuationEngine;
