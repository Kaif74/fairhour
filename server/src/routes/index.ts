import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import serviceRoutes from './service.routes';
import requestRoutes from './request.routes';
import exchangeRoutes from './exchange.routes';
import conversationRoutes from './conversation.routes';
import occupationRoutes from './occupation.routes';
import reviewRoutes from './review.routes';
import valuationRoutes from './valuation.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'FairHour API is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/requests', requestRoutes);
router.use('/exchanges', exchangeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/occupations', occupationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/valuation', valuationRoutes);

export default router;
