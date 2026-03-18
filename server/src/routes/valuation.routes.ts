import { Router } from 'express';
import { estimateCredits } from '../controllers/valuation.controller';

const router = Router();

/**
 * @route   GET /api/valuation/estimate
 * @desc    Estimate credits for a service (public preview)
 * @access  Public
 */
router.get('/estimate', estimateCredits);

export default router;
