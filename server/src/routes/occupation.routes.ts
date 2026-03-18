import { Router } from 'express';
import {
    getOccupations,
    getOccupationById,
    getMajorGroups,
} from '../controllers/occupation.controller';

const router = Router();

/**
 * @route   GET /api/occupations/groups
 * @desc    Get all unique major groups
 * @access  Public
 */
router.get('/groups', getMajorGroups);

/**
 * @route   GET /api/occupations
 * @desc    Get all occupations with optional search/filter
 * @access  Public
 */
router.get('/', getOccupations);

/**
 * @route   GET /api/occupations/:id
 * @desc    Get a single occupation by ID
 * @access  Public
 */
router.get('/:id', getOccupationById);

export default router;
