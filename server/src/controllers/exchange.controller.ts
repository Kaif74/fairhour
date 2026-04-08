import { Request, Response, NextFunction } from 'express';
import { ExchangeStatus, OtpPhase } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';
import { CreateExchangeInput } from '../schemas/exchange.schema';
import { ensureConversationForExchange } from '../services/chat.service';
import { exchangeOtpService } from '../services/exchange-otp.service';

/**
 * Request a service from a provider
 * POST /exchanges/request
 * The authenticated user becomes the REQUESTER, the service owner becomes the PROVIDER
 */
export async function requestService(
  req: Request<object, object, { serviceId: string; hours: number; message?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { serviceId, hours } = req.body;
    const requesterId = req.user.userId;

    // Validate service exists and get provider
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { user: true },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (!service.isActive) {
      throw new AppError('This service is not currently available', 400);
    }

    const providerId = service.userId;

    // Cannot request your own service
    if (providerId === requesterId) {
      throw new AppError('Cannot request your own service', 400);
    }

    // Calculate user's current credit balance before allowing the request
    // Balance = credits earned as provider - credits spent as requester
    // Uses creditsEarned (from valuation) when available, falls back to hours
    const completedAsProvider = await prisma.exchange.findMany({
      where: {
        providerId: requesterId,
        status: 'COMPLETED',
      },
      select: { creditsEarned: true, hours: true },
    });

    const completedAsRequester = await prisma.exchange.findMany({
      where: {
        requesterId: requesterId,
        status: 'COMPLETED',
        NOT: {
          providerId: requesterId, // Exclude signup bonus
        },
      },
      select: { creditsEarned: true, hours: true },
    });

    // Sum credits earned (use creditsEarned if available, otherwise hours)
    const earned = completedAsProvider.reduce((sum, ex) => sum + (ex.creditsEarned ?? ex.hours), 0);
    // Sum credits spent (credits spent = creditsEarned by the provider in that exchange)
    const spent = completedAsRequester.reduce((sum, ex) => sum + (ex.creditsEarned ?? ex.hours), 0);
    const currentBalance = earned - spent;

    // Check if user has sufficient balance for this request
    if (currentBalance < hours) {
      throw new AppError(
        `Insufficient balance. You have ${currentBalance.toFixed(1)} credit(s) available, but this service requires ${hours} hour(s). ` +
          `Please provide services to earn more credits first.`,
        400
      );
    }

    // Create exchange with PENDING status
    const exchange = await prisma.exchange.create({
      data: {
        providerId,
        requesterId,
        hours,
        status: 'PENDING',
        serviceId,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            location: true,
            profileImageUrl: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            location: true,
            profileImageUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Service request sent successfully',
      data: {
        ...exchange,
        service: {
          id: service.id,
          title: service.title,
          category: service.category,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new exchange (time transaction) - Provider initiated
 * POST /exchanges
 */
export async function createExchange(
  req: Request<object, object, CreateExchangeInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { requesterId, hours, serviceId } = req.body;

    // Provider is the authenticated user
    const providerId = req.user.userId;

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, userId: true },
      });

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      if (service.userId !== providerId) {
        throw new AppError('Cannot use a service you do not own', 403);
      }
    }

    // Validate that requester exists
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new AppError('Requester not found', 404);
    }

    // Cannot create exchange with yourself
    if (providerId === requesterId) {
      throw new AppError('Cannot create exchange with yourself', 400);
    }

    const exchange = await prisma.exchange.create({
      data: {
        providerId,
        requesterId,
        hours,
        serviceId: serviceId || null,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
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
      message: 'Exchange created successfully',
      data: exchange,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's exchanges (as provider or requester)
 * GET /exchanges/me
 */
export async function getMyExchanges(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { status, limit = 20, offset = 0, role } = req.query;
    const userId = req.user.userId;

    // Build where clause based on role
    type WhereClause = {
      status?: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED';
      providerId?: string;
      requesterId?: string;
      OR?: Array<{ providerId?: string; requesterId?: string }>;
    };

    const where: WhereClause = {};

    if (role === 'provider') {
      where.providerId = userId;
    } else if (role === 'requester') {
      where.requesterId = userId;
    } else {
      // Default: show all exchanges where user is involved
      where.OR = [{ providerId: userId }, { requesterId: userId }];
    }

    if (status && typeof status === 'string') {
      where.status = status as 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED';
    }

    const [exchanges, total] = await Promise.all([
      prisma.exchange.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          reviews: {
            where: { reviewerId: userId },
            select: { id: true },
          },
          provider: {
            select: {
              id: true,
              name: true,
              location: true,
              reputationScore: true,
            },
          },
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
      prisma.exchange.count({ where }),
    ]);

    // Add role information to each exchange
    const exchangesWithRole = exchanges.map((exchange: (typeof exchanges)[number]) => ({
      ...exchange,
      userRole: exchange.providerId === userId ? 'provider' : 'requester',
      hasMyReview: exchange.reviews.length > 0,
    }));

    res.json({
      success: true,
      data: {
        exchanges: exchangesWithRole,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + exchanges.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirm exchange completion (both parties must confirm)
 * PUT /exchanges/:id/confirm
 * Provider confirms service delivered, Requester confirms service received
 * Exchange only completes when both confirm
 */
export async function confirmExchange(
  _req: Request<{ id: string }>,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    throw new AppError(
      'Manual completion is no longer available. Use the OTP verification flow instead.',
      410
    );
  } catch (error) {
    next(error);
  }
}

export async function getOtpStatus(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const status = await exchangeOtpService.getOtpStatus(req.params.id, req.user.userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateStartOtp(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await exchangeOtpService.generatePhaseOtps(
      req.params.id,
      req.user.userId,
      OtpPhase.START
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyStartOtp(
  req: Request<{ id: string }, object, { otp: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.body.otp || req.body.otp.trim().length !== 6) {
      throw new AppError('A valid 6-digit OTP is required', 400);
    }

    const result = await exchangeOtpService.verifyPhaseOtp(
      req.params.id,
      req.user.userId,
      OtpPhase.START,
      req.body.otp
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateCompletionOtp(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await exchangeOtpService.generatePhaseOtps(
      req.params.id,
      req.user.userId,
      OtpPhase.COMPLETION
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyCompletionOtp(
  req: Request<{ id: string }, object, { otp: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.body.otp || req.body.otp.trim().length !== 6) {
      throw new AppError('A valid 6-digit OTP is required', 400);
    }

    const result = await exchangeOtpService.verifyPhaseOtp(
      req.params.id,
      req.user.userId,
      OtpPhase.COMPLETION,
      req.body.otp
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Accept an exchange request and prepare the start OTP handshake
 * PUT /exchanges/:id/activate
 */
export async function activateExchange(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Check if exchange exists
    const existingExchange = await prisma.exchange.findUnique({
      where: { id },
    });

    if (!existingExchange) {
      throw new AppError('Exchange not found', 404);
    }

    // Only the provider can accept a pending request
    if (existingExchange.providerId !== req.user.userId) {
      throw new AppError('Only the provider can accept this exchange', 403);
    }

    // Can only activate PENDING exchanges
    if (existingExchange.status !== 'PENDING') {
      throw new AppError(
        `Cannot activate exchange with status: ${existingExchange.status}. Exchange must be PENDING.`,
        400
      );
    }

    const exchange = await prisma.exchange.update({
      where: { id },
      data: { status: ExchangeStatus.ACCEPTED },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: { title: true },
        },
      },
    });

    await ensureConversationForExchange(exchange.id);
    const otpResult = await exchangeOtpService.generatePhaseOtps(
      exchange.id,
      req.user.userId,
      OtpPhase.START
    );

    res.json({
      success: true,
      message: 'Request accepted. Share the start OTP with the receiver to begin.',
      data: {
        ...exchange,
        otpStatus: otpResult.otpStatus,
        revealedOtp: otpResult.revealedOtp,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject/Cancel an exchange (provider can reject PENDING requests)
 * PUT /exchanges/:id/reject
 */
export async function rejectExchange(
  req: Request<{ id: string }, object, { reason?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { reason } = req.body;

    // Check if exchange exists
    const existingExchange = await prisma.exchange.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    if (!existingExchange) {
      throw new AppError('Exchange not found', 404);
    }

    // Only provider can reject, or requester can cancel their own request
    const isProvider = existingExchange.providerId === req.user.userId;
    const isRequester = existingExchange.requesterId === req.user.userId;

    if (!isProvider && !isRequester) {
      throw new AppError('Not authorized to reject this exchange', 403);
    }

    // Can only reject PENDING exchanges
    if (existingExchange.status !== 'PENDING') {
      throw new AppError(
        `Cannot reject exchange with status: ${existingExchange.status}. Only PENDING exchanges can be rejected.`,
        400
      );
    }

    // Delete the exchange (or you could add a REJECTED status if you want to keep records)
    await prisma.exchange.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: isProvider
        ? 'Service request rejected successfully'
        : 'Service request cancelled successfully',
      data: {
        exchangeId: id,
        rejectedBy: isProvider ? 'provider' : 'requester',
        reason: reason || null,
      },
    });
  } catch (error) {
    next(error);
  }
}
