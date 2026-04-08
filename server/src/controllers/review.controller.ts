import { Request, Response, NextFunction } from 'express';
import { CredibilityEventType } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';
import { credibilityService } from '../services/credibility.service';

/**
 * Create a review for a completed exchange
 * POST /reviews
 */
export async function createReview(
    req: Request<object, object, { exchangeId: string; rating: number; comment?: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { exchangeId, rating, comment } = req.body;
        const reviewerId = req.user.userId;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            throw new AppError('Rating must be between 1 and 5', 400);
        }

        // Fetch the exchange
        const exchange = await prisma.exchange.findUnique({
            where: { id: exchangeId },
            include: {
                service: {
                    select: {
                        occupationId: true,
                    },
                },
            },
        });

        if (!exchange) {
            throw new AppError('Exchange not found', 404);
        }

        if (exchange.status !== 'COMPLETED') {
            throw new AppError('Can only review completed exchanges', 400);
        }

        // Only the requester can review the provider
        if (exchange.requesterId !== reviewerId) {
            throw new AppError('Only the requester can review the provider', 403);
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findUnique({
            where: {
                exchangeId_reviewerId: {
                    exchangeId,
                    reviewerId,
                },
            },
        });

        if (existingReview) {
            throw new AppError('You have already reviewed this exchange', 400);
        }

        const review = await prisma.review.create({
            data: {
                exchangeId,
                reviewerId,
                providerId: exchange.providerId,
                rating,
                comment: comment || null,
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        profileImageUrl: true,
                    },
                },
            },
        });

        // Update provider's reputation score (average of all ratings)
        const avgRating = await prisma.review.aggregate({
            where: { providerId: exchange.providerId },
            _avg: { rating: true },
        });

        if (avgRating._avg.rating !== null) {
            await prisma.user.update({
                where: { id: exchange.providerId },
                data: { reputationScore: avgRating._avg.rating },
            });
        }

        if (exchange.service?.occupationId) {
            const occupationId = exchange.service.occupationId;

            await credibilityService.logEvent({
                userId: exchange.providerId,
                occupationId,
                eventType: CredibilityEventType.REVIEW_ADDED,
                metadata: {
                    reviewId: review.id,
                    exchangeId,
                    reviewerId,
                    rating,
                },
            });

            if (rating <= 2) {
                await credibilityService.logEvent({
                    userId: exchange.providerId,
                    occupationId,
                    eventType: CredibilityEventType.DISPUTE,
                    metadata: {
                        reviewId: review.id,
                        exchangeId,
                        reviewerId,
                        rating,
                    },
                });
            }

            await credibilityService.calculateExperienceScore(exchange.providerId, occupationId);
        }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get reviews for a provider
 * GET /reviews/provider/:id
 */
export async function getProviderReviews(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const [reviews, total, avgRating] = await Promise.all([
            prisma.review.findMany({
                where: { providerId: id },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profileImageUrl: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: Math.min(Number(limit), 100),
                skip: Number(offset),
            }),
            prisma.review.count({ where: { providerId: id } }),
            prisma.review.aggregate({
                where: { providerId: id },
                _avg: { rating: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                reviews,
                averageRating: avgRating._avg.rating
                    ? parseFloat(avgRating._avg.rating.toFixed(2))
                    : null,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + reviews.length < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
