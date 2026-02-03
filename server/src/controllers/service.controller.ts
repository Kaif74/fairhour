import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreateServiceInput, UpdateServiceInput } from '../schemas/service.schema';

/**
 * Create a new service
 * POST /services
 */
export async function createService(
    req: Request<object, object, CreateServiceInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { title, description, category } = req.body;

        const service = await prisma.service.create({
            data: {
                userId: req.user.userId,
                title,
                description,
                category,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all services with optional filters
 * GET /services
 */
export async function getServices(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { category, isActive, limit = 20, offset = 0 } = req.query;

        const where: {
            category?: string;
            isActive?: boolean;
        } = {};

        if (category && typeof category === 'string') {
            where.category = category;
        }

        // Default to showing only active services unless explicitly set to false
        if (isActive === 'false') {
            where.isActive = false;
        } else {
            where.isActive = true;
        }

        const [services, total] = await Promise.all([
            prisma.service.findMany({
                where,
                include: {
                    user: {
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
            prisma.service.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                services,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + services.length < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a single service by ID with full provider details
 * GET /services/:id
 */
export async function getServiceById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        location: true,
                        bio: true,
                        skills: true,
                        availability: true,
                        reputationScore: true,
                        profileImageUrl: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!service) {
            throw new AppError('Service not found', 404);
        }

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get services belonging to the authenticated user
 * GET /services/me
 */
export async function getMyServices(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const services = await prisma.service.findMany({
            where: {
                userId: req.user.userId,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: {
                services,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a service (owner only)
 * PUT /services/:id
 */
export async function updateService(
    req: Request<{ id: string }, object, UpdateServiceInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { id } = req.params;
        const { title, description, category, isActive } = req.body;

        // Check if service exists and belongs to user
        const existingService = await prisma.service.findUnique({
            where: { id },
        });

        if (!existingService) {
            throw new AppError('Service not found', 404);
        }

        if (existingService.userId !== req.user.userId) {
            throw new AppError('Not authorized to update this service', 403);
        }

        // Build update data
        const updateData: {
            title?: string;
            description?: string;
            category?: string;
            isActive?: boolean;
        } = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive;

        const service = await prisma.service.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'Service updated successfully',
            data: service,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a service (owner only)
 * DELETE /services/:id
 */
export async function deleteService(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { id } = req.params;

        // Check if service exists and belongs to user
        const existingService = await prisma.service.findUnique({
            where: { id },
        });

        if (!existingService) {
            throw new AppError('Service not found', 404);
        }

        if (existingService.userId !== req.user.userId) {
            throw new AppError('Not authorized to delete this service', 403);
        }

        await prisma.service.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        next(error);
    }
}
