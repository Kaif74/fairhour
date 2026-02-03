import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import routes from './routes';
import { generalLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';

// Import Express type extensions
import './types/express';

const app = express();

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet - Secure HTTP headers
app.use(helmet());

// CORS - Explicitly allow frontend
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General rate limiting
app.use(generalLimiter);

// =============================================================================
// BODY PARSING
// =============================================================================

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// =============================================================================
// REQUEST LOGGING (Development only)
// =============================================================================

if (config.isDevelopment) {
    app.use((req, _res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// =============================================================================
// ROOT HEALTH CHECK (Accessible at /)
// =============================================================================

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'FairHour API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// =============================================================================
// API ROUTES
// =============================================================================

app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Welcome to FairHour API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api',
            docs: '/api/health',
        },
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
