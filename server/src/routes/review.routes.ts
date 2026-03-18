import { Router } from 'express';
import { createReview, getProviderReviews } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a review for a completed exchange
 * @access  Private
 */
router.post('/', authenticate, createReview);

/**
 * @route   GET /api/reviews/provider/:id
 * @desc    Get reviews for a specific provider
 * @access  Public
 */
router.get('/provider/:id', getProviderReviews);

export default router;
