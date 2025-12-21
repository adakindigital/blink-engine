// =============================================================================
// Blink Engine - Correlation ID Middleware
// =============================================================================
// Injects correlation ID for request tracing

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}

/**
 * Middleware to inject correlation ID into every request
 * Uses X-Correlation-ID header if provided, otherwise generates a new one
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const correlationId =
        (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string) ||
        randomUUID();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
};
