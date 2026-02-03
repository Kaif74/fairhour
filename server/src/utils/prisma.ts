import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in development
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}

export default prisma;

/**
 * Test database connection
 * Throws error if connection fails
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        // Run a simple query to verify connection
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

/**
 * Graceful shutdown handler
 */
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}
