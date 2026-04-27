import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

// Default avatar URLs for users who don't upload a profile picture
const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
];

// Standard user fields to return (excluding password)
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
  walletAddress: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Get a random default avatar URL
 */
function getRandomDefaultAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

/**
 * Get current user profile
 * GET /users/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        ...userSelectFields,
        _count: {
          select: {
            services: true,
            requestsMade: true,
            exchangesAsProvider: true,
            exchangesAsRequester: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Format response with stats
    const { _count, ...userData } = user;

    res.json({
      success: true,
      data: {
        user: {
          ...userData,
          // Always provide a valid avatar URL
          profileImageUrl: userData.profileImageUrl || getRandomDefaultAvatar(),
          stats: {
            servicesCount: _count.services,
            requestsCount: _count.requestsMade,
            exchangesAsProvider: _count.exchangesAsProvider,
            exchangesAsRequester: _count.exchangesAsRequester,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user profile
 * PATCH /users/profile
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { name, location, bio, skills, availability, profileImageUrl, walletAddress } = req.body;

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      throw new AppError('Name must be at least 2 characters', 400);
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      throw new AppError('Skills must be an array', 400);
    }

    if (availability !== undefined && !Array.isArray(availability)) {
      throw new AppError('Availability must be an array', 400);
    }

    // Build update data
    const updateData: {
      name?: string;
      location?: string | null;
      bio?: string | null;
      skills?: string[];
      availability?: string[];
      profileImageUrl?: string | null;
      walletAddress?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (skills !== undefined) updateData.skills = skills;
    if (availability !== undefined) updateData.availability = availability;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl || null;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress || null;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: userSelectFields,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          ...user,
          profileImageUrl: user.profileImageUrl || getRandomDefaultAvatar(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete onboarding
 * POST /users/onboarding/complete
 */
export async function completeOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { skills, bio, availability, profileImageUrl } = req.body;

    // Validate required fields
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      throw new AppError('At least one skill is required', 400);
    }

    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      throw new AppError('At least one availability slot is required', 400);
    }

    // Assign default avatar if none provided
    const avatarUrl = profileImageUrl || getRandomDefaultAvatar();

    // Update user with onboarding data
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        hasOnboarded: true,
        skills: skills,
        bio: bio?.trim() || null,
        availability: availability,
        profileImageUrl: avatarUrl,
      },
      select: userSelectFields,
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: {
          ...user,
          profileImageUrl: user.profileImageUrl || avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's time balance (calculated from exchanges)
 * GET /users/me/balance
 */
export async function getTimeBalance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const userId = req.user.userId;

    // Calculate credits earned (provider side)
    // Use creditsEarned when available, fallback to hours for legacy/self-referential records
    const completedAsProvider = await prisma.exchange.findMany({
      where: {
        providerId: userId,
        status: 'COMPLETED',
      },
      select: {
        creditsEarned: true,
        hours: true,
      },
    });

    // Calculate credits spent (requester side)
    // Excludes self-referential exchanges (signup bonus should count only as earned)
    const completedAsRequester = await prisma.exchange.findMany({
      where: {
        requesterId: userId,
        status: 'COMPLETED',
        NOT: {
          providerId: userId,
        },
      },
      select: {
        creditsEarned: true,
        hours: true,
      },
    });

    const earnedCredits = completedAsProvider.reduce(
      (sum, exchange) => sum + (exchange.creditsEarned ?? exchange.hours),
      0
    );
    const spentCredits = completedAsRequester.reduce(
      (sum, exchange) => sum + (exchange.creditsEarned ?? exchange.hours),
      0
    );
    const balance = earnedCredits - spentCredits;

    // Round to 1 decimal place to avoid floating point precision issues
    const roundedEarned = Math.round(earnedCredits * 10) / 10;
    const roundedSpent = Math.round(spentCredits * 10) / 10;
    const roundedBalance = Math.round(balance * 10) / 10;

    res.json({
      success: true,
      data: {
        balance: roundedBalance,
        hoursEarned: roundedEarned,
        hoursSpent: roundedSpent,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Keep updateMe for backwards compatibility but deprecate
export const updateMe = updateProfile;
