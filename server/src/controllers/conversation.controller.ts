import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

const MAX_PAGE_SIZE = 100;

export async function getMyConversations(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const userId = req.user.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            include: {
                userA: {
                    select: { id: true, name: true, profileImageUrl: true },
                },
                userB: {
                    select: { id: true, name: true, profileImageUrl: true },
                },
                exchange: {
                    select: {
                        id: true,
                        status: true,
                        providerId: true,
                        requesterId: true,
                        hours: true,
                        service: { select: { title: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });

        const conversationIds = conversations.map((conversation) => conversation.id);

        const unreadCounts = conversationIds.length
            ? await prisma.message.groupBy({
                by: ['conversationId'],
                where: {
                    conversationId: { in: conversationIds },
                    senderId: { not: userId },
                    readAt: null,
                },
                _count: { _all: true },
            })
            : [];

        const unreadMap = new Map(
            unreadCounts.map((entry) => [entry.conversationId, entry._count._all])
        );

        const formatted = conversations.map((conversation) => {
            const otherUser =
                conversation.userAId === userId ? conversation.userB : conversation.userA;
            const lastMessage = conversation.messages[0] || null;

            return {
                id: conversation.id,
                exchangeId: conversation.exchangeId,
                status: conversation.status,
                serviceTitle:
                    conversation.serviceTitle ??
                    conversation.exchange?.service?.title ??
                    'Time Exchange',
                otherUser,
                lastMessage: lastMessage
                    ? {
                        id: lastMessage.id,
                        conversationId: lastMessage.conversationId,
                        senderId: lastMessage.senderId,
                        content: lastMessage.content,
                        createdAt: lastMessage.createdAt,
                        readAt: lastMessage.readAt,
                    }
                    : null,
                lastMessageAt: conversation.lastMessageAt,
                unreadCount: unreadMap.get(conversation.id) || 0,
                exchange: conversation.exchange,
            };
        });

        res.json({
            success: true,
            data: {
                conversations: formatted,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getConversationMessages(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { id } = req.params;
        const userId = req.user.userId;
        const rawLimit = Number(req.query.limit || 50);
        const limit = Number.isNaN(rawLimit) ? 50 : Math.min(rawLimit, MAX_PAGE_SIZE);
        const rawOffset = Number(req.query.offset || 0);
        const offset = Number.isNaN(rawOffset) ? 0 : rawOffset;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                userA: { select: { id: true, name: true, profileImageUrl: true } },
                userB: { select: { id: true, name: true, profileImageUrl: true } },
                exchange: {
                    select: {
                        id: true,
                        status: true,
                        providerId: true,
                        requesterId: true,
                        hours: true,
                        service: { select: { title: true } },
                    },
                },
            },
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        const isParticipant =
            conversation.userAId === userId || conversation.userBId === userId;

        if (!isParticipant) {
            throw new AppError('Not authorized to view this conversation', 403);
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { conversationId: id },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: offset,
            }),
            prisma.message.count({ where: { conversationId: id } }),
        ]);

        const otherUser =
            conversation.userAId === userId ? conversation.userB : conversation.userA;

        res.json({
            success: true,
            data: {
                conversation: {
                    id: conversation.id,
                    exchangeId: conversation.exchangeId,
                    status: conversation.status,
                    serviceTitle:
                        conversation.serviceTitle ??
                        conversation.exchange?.service?.title ??
                        'Time Exchange',
                    otherUser,
                    exchange: conversation.exchange,
                },
                messages,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + messages.length < total,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function markConversationRead(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const { id } = req.params;
        const userId = req.user.userId;

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                OR: [{ userAId: userId }, { userBId: userId }],
            },
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        const readAt = new Date();

        const result = await prisma.message.updateMany({
            where: {
                conversationId: id,
                senderId: { not: userId },
                readAt: null,
            },
            data: { readAt },
        });

        res.json({
            success: true,
            data: {
                updated: result.count,
                readAt,
            },
        });
    } catch (error) {
        next(error);
    }
}
