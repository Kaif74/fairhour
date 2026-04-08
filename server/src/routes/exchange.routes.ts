import { Router } from 'express';
import {
    createExchange,
    requestService,
    getMyExchanges,
    confirmExchange,
    activateExchange,
    rejectExchange,
    getOtpStatus,
    generateStartOtp,
    verifyStartOtp,
    generateCompletionOtp,
    verifyCompletionOtp,
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
 * @desc    Accept an exchange request and prepare the start OTP handshake
 * @access  Private
 */
router.put('/:id/activate', activateExchange);

/**
 * @route   GET /api/exchanges/:id/otp/status
 * @desc    Get OTP handshake status for an exchange
 * @access  Private
 */
router.get('/:id/otp/status', getOtpStatus);

/**
 * @route   POST /api/exchanges/:id/otp/start/generate
 * @desc    Generate or regenerate the start-phase directional OTP
 * @access  Private
 */
router.post('/:id/otp/start/generate', generateStartOtp);

/**
 * @route   POST /api/exchanges/:id/otp/start/verify
 * @desc    Verify the start-phase OTP received from the other participant
 * @access  Private
 */
router.post('/:id/otp/start/verify', verifyStartOtp);

/**
 * @route   POST /api/exchanges/:id/otp/complete/generate
 * @desc    Generate or regenerate the completion-phase directional OTP
 * @access  Private
 */
router.post('/:id/otp/complete/generate', generateCompletionOtp);

/**
 * @route   POST /api/exchanges/:id/otp/complete/verify
 * @desc    Verify the completion-phase OTP received from the other participant
 * @access  Private
 */
router.post('/:id/otp/complete/verify', verifyCompletionOtp);

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


