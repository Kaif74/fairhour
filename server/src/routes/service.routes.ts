import { Router } from 'express';
import {
    createService,
    getServices,
    getServiceById,
    getMyServices,
    updateService,
    deleteService,
} from '../controllers/service.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createServiceSchema, updateServiceSchema } from '../schemas/service.schema';

const router = Router();

/**
 * @route   GET /api/services/me
 * @desc    Get current user's services
 * @access  Private
 */
router.get('/me', authenticate, getMyServices);

/**
 * @route   GET /api/services
 * @desc    Get all active services
 * @access  Public
 */
router.get('/', getServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get a single service by ID with provider details
 * @access  Public
 */
router.get('/:id', getServiceById);

/**
 * @route   POST /api/services
 * @desc    Create a new service
 * @access  Private
 */
router.post('/', authenticate, validate(createServiceSchema), createService);

/**
 * @route   PUT /api/services/:id
 * @desc    Update a service (owner only)
 * @access  Private
 */
router.put('/:id', authenticate, validate(updateServiceSchema), updateService);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete a service (owner only)
 * @access  Private
 */
router.delete('/:id', authenticate, deleteService);

export default router;
