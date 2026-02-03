import prisma from '../utils/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

export type ConversationParticipant = {
    id: string;
    userAId: string;
    userBId: string;
    status: 'ACTIVE' | 'LOCKED';
};

export async function ensureConversationForExchange(exchangeId: string): Promise<void> {
    const exchange = await prisma.exchange.findUnique({
        where: { id: exchangeId },
        include: {
            service: { select: { title: true } },
        },
    });

    if (!exchange) {
        throw new AppError('Exchange not found', 404);
    }

    await prisma.conversation.upsert({
        where: { exchangeId },
        update: {
            status: 'ACTIVE',
            serviceTitle: exchange.service?.title ?? null,
        },
        create: {
            exchangeId,
            userAId: exchange.providerId,
            userBId: exchange.requesterId,
            status: 'ACTIVE',
            serviceTitle: exchange.service?.title ?? null,
            lastMessageAt: new Date(),
        },
    });
}

export async function lockConversationForExchange(exchangeId: string): Promise<void> {
    await prisma.conversation.updateMany({
        where: { exchangeId },
        data: { status: 'LOCKED' },
    });
}

export async function getConversationForUser(
    conversationId: string,
    userId: string
): Promise<ConversationParticipant | null> {
    return prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: {
            id: true,
            userAId: true,
            userBId: true,
            status: true,
        },
    });
}

export async function createMessage(
    conversationId: string,
    senderId: string,
    content: string
) {
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId,
            content,
        },
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
    });

    return message;
}

export async function markConversationRead(
    conversationId: string,
    readerId: string
): Promise<{ count: number; readAt: Date }> {
    const readAt = new Date();

    const result = await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: readerId },
            readAt: null,
        },
        data: { readAt },
    });

    return { count: result.count, readAt };
}
