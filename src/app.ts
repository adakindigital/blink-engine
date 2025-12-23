// =============================================================================
// Blink Engine - Application Entry Point
// =============================================================================
// Express application setup and server initialization

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { checkDatabaseConnection, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { correlationIdMiddleware } from './middleware/correlation-id.middleware.js';
import { standardRateLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRoutes } from './routes/index.js';

// =============================================================================
// Application Setup
// =============================================================================

const createApp = (): Express => {
    const app = express();

    // =============================================================================
    // Security Middleware
    // =============================================================================

    // Helmet - Security headers
    app.use(
        helmet({
            contentSecurityPolicy: config.isProd,
            crossOriginEmbedderPolicy: config.isProd,
        })
    );

    // CORS
    app.use(
        cors({
            origin: config.cors.origins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
        })
    );

    // =============================================================================
    // Request Processing Middleware
    // =============================================================================

    // Correlation ID for request tracing
    app.use(correlationIdMiddleware);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting (applied globally)
    app.use(standardRateLimiter);

    // =============================================================================
    // Health Check Endpoint
    // =============================================================================

    app.get('/health', async (_req, res) => {
        const dbHealthy = await checkDatabaseConnection();

        const status = {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            checks: {
                database: dbHealthy ? 'up' : 'down',
            },
        };

        res.status(dbHealthy ? 200 : 503).json(status);
    });

    // Ready check (for Kubernetes)
    app.get('/ready', async (_req, res) => {
        const dbHealthy = await checkDatabaseConnection();
        if (dbHealthy) {
            res.status(200).json({ ready: true });
        } else {
            res.status(503).json({ ready: false, reason: 'Database not available' });
        }
    });

    // =============================================================================
    // API Routes
    // =============================================================================

    app.use('/api', apiRoutes);

    // =============================================================================
    // Error Handling
    // =============================================================================

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    return app;
};

// =============================================================================
// Server Initialization
// =============================================================================

const startServer = async (): Promise<void> => {
    try {
        // Validate configuration (will throw if invalid)
        config.env;
        logger.info('Configuration validated');

        // Test database connection
        const dbConnected = await checkDatabaseConnection();
        if (!dbConnected) {
            throw new Error('Failed to connect to database');
        }
        logger.info('Database connected');

        // Create and start Express app
        const app = createApp();

        // Create HTTP server (required for Socket.io)
        const { createServer } = await import('http');
        const httpServer = createServer(app);

        // Initialize Socket Service
        const { socketService } = await import('./services/socket.service.js');
        socketService.initialize(httpServer, config.cors.origins);

        const server = httpServer.listen(config.server.port, config.server.host, () => {
            logger.info(`🚀 Blink Engine started (HTTP + WebSocket)`, {
                port: config.server.port,
                env: config.env,
                host: config.server.host,
            });
        });

        // =============================================================================
        // Graceful Shutdown
        // =============================================================================

        const gracefulShutdown = async (signal: string): Promise<void> => {
            logger.info(`Received ${signal}, starting graceful shutdown`);

            // Stop accepting new connections
            server.close(async () => {
                logger.info('HTTP server closed');

                // Disconnect database
                await disconnectDatabase();

                logger.info('Graceful shutdown complete');
                process.exit(0);
            });

            // Force exit after 30 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection', { reason });
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

// Start the server
startServer();

export { createApp };
