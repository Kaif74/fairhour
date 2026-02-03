import { Router } from 'express';
import {
    createRequest,
    getRequests,
    getPublicRequests,
    updateRequestStatus,
} from '../controllers/request.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createRequestSchema, updateRequestStatusSchema } from '../schemas/request.schema';

const router = Router();

/**
 * @route   GET /api/requests
 * @desc    Get all open requests (public - no auth required)
 * @access  Public
 */
router.get('/', getPublicRequests);

// Protected routes below
router.use(authenticate);

/**
 * @route   POST /api/requests
 * @desc    Create a new service request
 * @access  Private
 */
router.post('/', validate(createRequestSchema), createRequest);

/**
 * @route   GET /api/requests/me
 * @desc    Get current user's requests
 * @access  Private
 */
router.get('/me', getRequests);

/**
 * @route   PUT /api/requests/:id/status
 * @desc    Update request status (owner only)
 * @access  Private
 */
router.put('/:id/status', validate(updateRequestStatusSchema), updateRequestStatus);

export default router;
