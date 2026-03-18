import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

/**
 * Get all occupations with optional filtering
 * GET /occupations?search=&majorGroup=&skillLevel=
 */
export async function getOccupations(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { search, majorGroup, skillLevel } = req.query;

        const where: {
            majorGroup?: string;
            skillLevel?: number;
            OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; ncoCode?: { contains: string } }>;
        } = {};

        if (majorGroup && typeof majorGroup === 'string') {
            where.majorGroup = majorGroup;
        }

        if (skillLevel && typeof skillLevel === 'string') {
            where.skillLevel = parseInt(skillLevel, 10);
        }

        if (search && typeof search === 'string') {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { ncoCode: { contains: search } },
            ];
        }

        const occupations = await prisma.occupation.findMany({
            where,
            include: {
                serviceStats: true,
                _count: {
                    select: { services: true },
                },
            },
            orderBy: [{ skillLevel: 'desc' }, { title: 'asc' }],
        });

        res.json({
            success: true,
            data: {
                occupations,
                total: occupations.length,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a single occupation by ID
 * GET /occupations/:id
 */
export async function getOccupationById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;

        const occupation = await prisma.occupation.findUnique({
            where: { id },
            include: {
                serviceStats: true,
                _count: {
                    select: { services: true },
                },
            },
        });

        if (!occupation) {
            throw new AppError('Occupation not found', 404);
        }

        res.json({
            success: true,
            data: occupation,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all unique major groups
 * GET /occupations/groups
 */
export async function getMajorGroups(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const groups = await prisma.occupation.findMany({
            distinct: ['majorGroup'],
            select: {
                majorGroup: true,
                skillLevel: true,
            },
            orderBy: { skillLevel: 'desc' },
        });

        res.json({
            success: true,
            data: groups,
        });
    } catch (error) {
        next(error);
    }
}
