import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
    // Server
    port: toNumber(process.env.PORT, 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',

    // Database
    databaseUrl: process.env.DATABASE_URL,

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    // CORS - Frontend URL
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // Redis (optional, used for Socket.IO adapter)
    redis: {
        url: process.env.REDIS_URL || '',
    },

    // Socket.IO
    socket: {
        path: process.env.SOCKET_PATH || '/socket.io',
    },

    // Chat configuration
    chat: {
        messageMaxLength: toNumber(process.env.CHAT_MESSAGE_MAX_LENGTH, 2000),
        rateLimit: {
            windowMs: toNumber(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60000),
            max: toNumber(process.env.CHAT_RATE_LIMIT_MAX, 30),
        },
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes

        // General API usage
        max: 1000,              // ~1 req/sec average, totally normal

        // Auth endpoints (login, OTP, password reset)
        authMax: 20,            // Humans fat-finger passwords, bots cry
    },

} as const;

// Validate required environment variables in production
if (config.isProduction) {
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

// Log configuration on startup (non-sensitive)
console.log(`📋 Config loaded: PORT=${config.port}, ENV=${config.nodeEnv}, CORS=${config.corsOrigin}`);

export default config;
