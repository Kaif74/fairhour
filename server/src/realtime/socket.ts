import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import config from '../config';
import { verifyToken } from '../utils/jwt';
import {
    createMessage,
    getConversationForUser,
    markConversationRead,
} from '../services/chat.service';

type SocketUser = {
    userId: string;
    email: string;
};

type JoinConversationPayload = {
    conversationId: string;
};

type SendMessagePayload = {
    conversationId: string;
    content: string;
    clientId?: string | null;
};

type MarkReadPayload = {
    conversationId: string;
};

type SocketResponse = {
    success: boolean;
    message?: string;
    updated?: number;
    clientId?: string | null;
};

type SocketCallback = (response: SocketResponse) => void;

type RateLimitEntry = {
    windowStart: number;
    count: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(key: string, windowMs: number, max: number): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return false;
    }

    if (entry.count >= max) {
        return true;
    }

    entry.count += 1;
    return false;
}

export async function initializeSocket(server: HttpServer): Promise<Server> {
    const io = new Server(server, {
        cors: {
            origin: config.corsOrigin,
            credentials: true,
        },
        path: config.socket.path,
    });

    if (config.redis.url) {
        const pubClient = new Redis(config.redis.url);
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
    }

    io.use((socket, next) => {
        const authHeader = socket.handshake.headers.authorization;
        const authToken =
            socket.handshake.auth?.token ||
            (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : null);

        if (!authToken) {
            return next(new Error('Unauthorized'));
        }

        try {
            const payload = verifyToken(authToken);
            socket.data.user = payload as SocketUser;
            return next();
        } catch (error) {
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const currentUser = socket.data.user as SocketUser;

        socket.on('join_conversation', async (payload: JoinConversationPayload, callback?: SocketCallback) => {
            try {
                const conversationId = String(payload?.conversationId || '');

                if (!conversationId) {
                    callback?.({ success: false, message: 'Conversation ID is required' });
                    return;
                }

                const conversation = await getConversationForUser(conversationId, currentUser.userId);

                if (!conversation) {
                    callback?.({ success: false, message: 'Conversation not found' });
                    return;
                }

                await socket.join(conversationId);
                callback?.({ success: true });
            } catch (error) {
                callback?.({ success: false, message: 'Failed to join conversation' });
            }
        });

        socket.on('send_message', async (payload: SendMessagePayload, callback?: SocketCallback) => {
            try {
                const conversationId = String(payload?.conversationId || '');
                const content = String(payload?.content || '').trim();
                const clientId = payload?.clientId ? String(payload.clientId) : null;

                if (!conversationId || !content) {
                    callback?.({ success: false, message: 'Conversation ID and content are required' });
                    return;
                }

                if (content.length > config.chat.messageMaxLength) {
                    callback?.({ success: false, message: 'Message is too long' });
                    return;
                }

                const rateKey = currentUser.userId;
                if (isRateLimited(rateKey, config.chat.rateLimit.windowMs, config.chat.rateLimit.max)) {
                    callback?.({ success: false, message: 'Rate limit exceeded' });
                    return;
                }

                const conversation = await getConversationForUser(conversationId, currentUser.userId);

                if (!conversation) {
                    callback?.({ success: false, message: 'Conversation not found' });
                    return;
                }

                if (conversation.status === 'LOCKED') {
                    callback?.({ success: false, message: 'Conversation is locked' });
                    return;
                }

                const message = await createMessage(
                    conversationId,
                    currentUser.userId,
                    content
                );

                const payloadOut = {
                    conversationId,
                    message: {
                        id: message.id,
                        conversationId: message.conversationId,
                        senderId: message.senderId,
                        content: message.content,
                        createdAt: message.createdAt,
                        readAt: message.readAt,
                    },
                    clientId,
                };

                io.to(conversationId).emit('message_received', payloadOut);
                callback?.({ success: true, clientId });
            } catch (error) {
                callback?.({ success: false, message: 'Failed to send message' });
            }
        });

        socket.on('mark_read', async (payload: MarkReadPayload, callback?: SocketCallback) => {
            try {
                const conversationId = String(payload?.conversationId || '');

                if (!conversationId) {
                    callback?.({ success: false, message: 'Conversation ID is required' });
                    return;
                }

                const conversation = await getConversationForUser(conversationId, currentUser.userId);

                if (!conversation) {
                    callback?.({ success: false, message: 'Conversation not found' });
                    return;
                }

                const result = await markConversationRead(conversationId, currentUser.userId);

                if (result.count > 0) {
                    io.to(conversationId).emit('mark_read', {
                        conversationId,
                        readerId: currentUser.userId,
                        readAt: result.readAt,
                    });
                }

                callback?.({ success: true, updated: result.count });
            } catch (error) {
                callback?.({ success: false, message: 'Failed to mark messages as read' });
            }
        });
    });

    return io;
}
