import { Router } from 'express';
import { getMe, updateProfile, completeOnboarding, getTimeBalance } from '../controllers/user.controller';
import {
  getUserCredibility,
  getUserSkillExperience,
  updateMyDeclaredExperience,
} from '../controllers/credibility.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateDeclaredExperienceSchema } from '../schemas/credibility.schema';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile (name, location, bio, skills, availability, profileImageUrl)
 * @access  Private
 */
router.patch('/profile', authenticate, updateProfile);

/**
 * @route   GET /api/users/me/balance
 * @desc    Get user's time balance
 * @access  Private
 */
router.get('/me/balance', authenticate, getTimeBalance);

/**
 * @route   POST /api/users/onboarding/complete
 * @desc    Complete user onboarding
 * @access  Private
 */
router.post('/onboarding/complete', authenticate, completeOnboarding);

/**
 * @route   PUT /api/users/me/experience/:occupationId
 * @desc    Set the authenticated user's declared experience level for a skill
 * @access  Private
 */
router.put(
  '/me/experience/:occupationId',
  authenticate,
  validate(updateDeclaredExperienceSchema),
  updateMyDeclaredExperience
);

/**
 * @route   GET /api/users/:id/experience/:occupationId
 * @desc    Get a user's credibility breakdown for a specific occupation
 * @access  Public
 */
router.get('/:id/experience/:occupationId', getUserSkillExperience);

/**
 * @route   GET /api/users/:id/credibility
 * @desc    Get all occupation credibility scores for a user
 * @access  Public
 */
router.get('/:id/credibility', getUserCredibility);

export default router;
