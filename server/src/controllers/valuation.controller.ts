import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler.middleware';
import { skillValuationEngine } from '../services/valuation.service';

/**
 * Estimate credits for a service
 * GET /valuation/estimate?occupationId=X&providerId=Y&hours=Z
 */
export async function estimateCredits(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { occupationId, providerId, hours } = req.query;

        const hoursNum = hours ? parseFloat(hours as string) : 1;

        if (isNaN(hoursNum) || hoursNum <= 0) {
            throw new AppError('Hours must be a positive number', 400);
        }

        // Get estimated rate
        const estimate = await skillValuationEngine.getEstimatedRate(
            occupationId as string || null,
            providerId as string || null
        );

        res.json({
            success: true,
            data: {
                hours: hoursNum,
                estimatedCredits: {
                    min: parseFloat((hoursNum * estimate.minCreditsPerHour).toFixed(2)),
                    max: parseFloat((hoursNum * estimate.maxCreditsPerHour).toFixed(2)),
                },
                ratePerHour: {
                    min: estimate.minCreditsPerHour,
                    max: estimate.maxCreditsPerHour,
                },
                breakdown: {
                    skillMultiplier: estimate.skillMultiplier,
                    skillLevel: estimate.skillLevel,
                    occupationTitle: estimate.occupationTitle,
                    reputationFactor: estimate.reputationFactor,
                    demandFactor: estimate.demandFactor,
                    experienceMultiplier: estimate.experienceMultiplier,
                    experienceScore: estimate.experienceScore,
                    rawMultiplier: estimate.rawMultiplier,
                    maxAllowedMultiplier: estimate.maxAllowedMultiplier,
                    capTier: estimate.capTier,
                    averageRating: estimate.averageRating,
                    reviewCount: estimate.reviewCount,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
