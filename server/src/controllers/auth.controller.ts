import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler.middleware';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

// Standard user fields to return (excludes passwordHash)
const userSelectFields = {
    id: true,
    name: true,
    email: true,
    location: true,
    reputationScore: true,
    hasOnboarded: true,
    skills: true,
    bio: true,
    profileImageUrl: true,
    availability: true,
    createdAt: true,
};

/**
 * Register a new user
 * POST /auth/register
 */
export async function register(
    req: Request<object, object, RegisterInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, email, password, location } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user (hasOnboarded defaults to false)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                location,
            },
            select: userSelectFields,
        });

        // SIGNUP BONUS: Give new users 2 hours of free credit
        // This is done by creating a completed exchange where:
        // - The new user is the "provider" (so they earn the hours)
        // - The user is also the "requester" (self-referential bonus)
        // This effectively adds 2 hours to their balance
        const SIGNUP_BONUS_HOURS = 2;

        try {
            await prisma.exchange.create({
                data: {
                    providerId: user.id,
                    requesterId: user.id, // Self-referential for signup bonus
                    hours: SIGNUP_BONUS_HOURS,
                    status: 'COMPLETED',
                    providerConfirmed: true,
                    requesterConfirmed: true,
                    completedAt: new Date(),
                },
            });
        } catch (bonusError) {
            // Log but don't fail registration if bonus creation fails
            console.error('Failed to create signup bonus:', bonusError);
        }

        // Generate token
        const token = signToken({ userId: user.id, email: user.email });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Welcome bonus: 2 hours credited!',
            data: {
                user,
                token,
                signupBonus: SIGNUP_BONUS_HOURS,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Login user
 * POST /auth/login
 */
export async function login(
    req: Request<object, object, LoginInput>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                ...userSelectFields,
                passwordHash: true, // Need this for password comparison
            },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate token
        const token = signToken({ userId: user.id, email: user.email });

        // Remove passwordHash from response
        const { passwordHash: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
}
