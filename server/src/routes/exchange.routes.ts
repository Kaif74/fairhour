import { Router } from 'express';
import {
    createExchange,
    requestService,
    getMyExchanges,
    confirmExchange,
    activateExchange,
    rejectExchange,
} from '../controllers/exchange.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createExchangeSchema } from '../schemas/exchange.schema';

const router = Router();

// All exchange routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/exchanges/request
 * @desc    Request a service from a provider (user becomes requester)
 * @access  Private
 */
router.post('/request', requestService);

/**
 * @route   POST /api/exchanges
 * @desc    Create a new exchange (time transaction)
 * @access  Private
 */
router.post('/', validate(createExchangeSchema), createExchange);

/**
 * @route   GET /api/exchanges/me
 * @desc    Get user's exchanges
 * @access  Private
 */
router.get('/me', getMyExchanges);

/**
 * @route   PUT /api/exchanges/:id/activate
 * @desc    Activate an exchange (accept a request, PENDING -> ACTIVE)
 * @access  Private
 */
router.put('/:id/activate', activateExchange);

/**
 * @route   PUT /api/exchanges/:id/reject
 * @desc    Reject/Cancel an exchange (provider rejects or requester cancels)
 * @access  Private
 */
router.put('/:id/reject', rejectExchange);

/**
 * @route   PUT /api/exchanges/:id/confirm
 * @desc    Confirm exchange completion (both parties must confirm for completion)
 * @access  Private
 */
router.put('/:id/confirm', confirmExchange);

export default router;


