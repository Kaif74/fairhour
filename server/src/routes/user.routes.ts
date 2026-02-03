import { Router } from 'express';
import { getMe, updateProfile, completeOnboarding, getTimeBalance } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', getMe);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile (name, location, bio, skills, availability, profileImageUrl)
 * @access  Private
 */
router.patch('/profile', updateProfile);

/**
 * @route   GET /api/users/me/balance
 * @desc    Get user's time balance
 * @access  Private
 */
router.get('/me/balance', getTimeBalance);

/**
 * @route   POST /api/users/onboarding/complete
 * @desc    Complete user onboarding
 * @access  Private
 */
router.post('/onboarding/complete', completeOnboarding);

export default router;
