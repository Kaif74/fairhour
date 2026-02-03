import { Router } from 'express';
import {
    getMyConversations,
    getConversationMessages,
    markConversationRead,
} from '../controllers/conversation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/conversations
 * @desc    List conversations for the authenticated user
 * @access  Private
 */
router.get('/', getMyConversations);

/**
 * @route   GET /api/conversations/:id/messages
 * @desc    Get message history for a conversation
 * @access  Private
 */
router.get('/:id/messages', getConversationMessages);

/**
 * @route   POST /api/conversations/:id/read
 * @desc    Mark all messages in a conversation as read
 * @access  Private
 */
router.post('/:id/read', markConversationRead);

export default router;
