import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreateRequestInput, UpdateRequestStatusInput } from '../schemas/request.schema';

/**
 * Create a new service request
 * POST /requests
 */
export async function createRequest(
    req: Request<object, object, CreateRequestInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { title, serviceCategory, description, hours } = req.body;

        const serviceRequest = await prisma.request.create({
            data: {
                requesterId: req.user.userId,
                title,
                serviceCategory,
                description,
                hours: hours || 1,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Request created successfully',
            data: serviceRequest,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all open requests (public - no auth required)
 * GET /requests
 */
export async function getPublicRequests(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { serviceCategory, limit = 20, offset = 0 } = req.query;

        const where: {
            status: 'OPEN';
            serviceCategory?: string;
        } = { status: 'OPEN' };

        if (serviceCategory && typeof serviceCategory === 'string') {
            where.serviceCategory = serviceCategory;
        }

        const [requests, total] = await Promise.all([
            prisma.request.findMany({
                where,
                include: {
                    requester: {
                        select: {
                            id: true,
                            name: true,
                            location: true,
                            reputationScore: true,
                            profileImageUrl: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: Math.min(Number(limit), 100),
                skip: Number(offset),
            }),
            prisma.request.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + requests.length < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all requests with optional filters
 * GET /requests
 */
export async function getRequests(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { status, serviceCategory, limit = 20, offset = 0, mine } = req.query;

        const where: {
            status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
            serviceCategory?: string;
            requesterId?: string;
        } = {};

        if (status && typeof status === 'string') {
            where.status = status as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
        }

        if (serviceCategory && typeof serviceCategory === 'string') {
            where.serviceCategory = serviceCategory;
        }

        // If mine=true, only show user's own requests
        if (mine === 'true') {
            where.requesterId = req.user.userId;
        }

        const [requests, total] = await Promise.all([
            prisma.request.findMany({
                where,
                include: {
                    requester: {
                        select: {
                            id: true,
                            name: true,
                            location: true,
                            reputationScore: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: Math.min(Number(limit), 100),
                skip: Number(offset),
            }),
            prisma.request.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                requests,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + requests.length < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update request status
 * PUT /requests/:id/status
 * - Owner can update any status
 * - Others can only set to IN_PROGRESS (when offering help)
 */
export async function updateRequestStatus(
    req: Request<{ id: string }, object, UpdateRequestStatusInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { id } = req.params;
        const { status } = req.body;

        // Check if request exists
        const existingRequest = await prisma.request.findUnique({
            where: { id },
        });

        if (!existingRequest) {
            throw new AppError('Request not found', 404);
        }

        // Allow owner to update any status
        // Allow others to only set status to IN_PROGRESS (offering help)
        const isOwner = existingRequest.requesterId === req.user.userId;
        const isOfferingHelp = status === 'IN_PROGRESS' && existingRequest.status === 'OPEN';

        if (!isOwner && !isOfferingHelp) {
            throw new AppError('Not authorized to update this request', 403);
        }

        const serviceRequest = await prisma.request.update({
            where: { id },
            data: { status },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Request status updated successfully',
            data: serviceRequest,
        });
    } catch (error) {
        next(error);
    }
}
