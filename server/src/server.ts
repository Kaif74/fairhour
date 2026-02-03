import http from 'http';
import app from './app';
import config from './config';
import { connectDatabase, disconnectPrisma } from './utils/prisma';
import { initializeSocket } from './realtime/socket';

/**
 * Start server only after database connection is verified
 */
async function startServer(): Promise<void> {
    try {
        // CRITICAL: Test database connection BEFORE starting server
        console.log('🔌 Connecting to database...');
        await connectDatabase();

        // Start HTTP server (Express + Socket.IO)
        const server = http.createServer(app);
        const io = await initializeSocket(server);

        server.listen(config.port, () => {
            console.log(`
🚀 FairHour API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${config.nodeEnv}
Port:        ${config.port}
API Base:    http://localhost:${config.port}/api
Health:      http://localhost:${config.port}/health
Socket:      http://localhost:${config.port}${config.socket.path}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });

        // =============================================================================
        // GRACEFUL SHUTDOWN
        // =============================================================================

        const gracefulShutdown = async (signal: string) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async () => {
                console.log('HTTP server closed.');

                // Disconnect from database
                try {
                    await disconnectPrisma();
                    console.log('Database connection closed.');
                } catch (error) {
                    console.error('Error closing database connection:', error);
                }

                io.close();

                process.exit(0);
            });

            // Force close after 30 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();
