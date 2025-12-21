// =============================================================================
// Blink Engine - Database Client
// =============================================================================
// Prisma client singleton with connection management

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// Global singleton for development hot-reload
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging based on environment
const createPrismaClient = (): PrismaClient => {
    const client = new PrismaClient({
        log: config.isDev
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ]
            : [{ emit: 'event', level: 'error' }],
    });

    // Log queries in development
    if (config.isDev) {
        client.$on('query', (e: Prisma.QueryEvent) => {
            logger.debug('Prisma Query', {
                query: e.query,
                params: e.params,
                duration: `${e.duration}ms`,
            });
        });
    }

    // Log errors
    client.$on('error', (e: Prisma.LogEvent) => {
        logger.error('Prisma Error', { message: e.message });
    });

    client.$on('warn', (e: Prisma.LogEvent) => {
        logger.warn('Prisma Warning', { message: e.message });
    });

    return client;
};

// Use global singleton in development to prevent connection exhaustion during hot-reload
export const prisma = global.prisma ?? createPrismaClient();

if (config.isDev) {
    global.prisma = prisma;
}

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
    await prisma.$disconnect();
    logger.info('Database disconnected');
};

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error('Database connection check failed', { error });
        return false;
    }
};
