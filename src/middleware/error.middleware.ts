// =============================================================================
// Blink Engine - Error Handling Middleware
// =============================================================================
// Centralized error handling - no stack traces to clients

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { isDomainError, ValidationError } from '../domain/errors/domain.errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * API Error Response Envelope
 */
interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        retryable: boolean;
    };
}

/**
 * Map Zod validation errors to our ValidationError format
 */
const mapZodError = (error: ZodError): ValidationError => {
    const details: Record<string, string[]> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!details[path]) {
            details[path] = [];
        }
        details[path].push(issue.message);
    }

    return new ValidationError('Validation failed', { fields: details });
};

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
export const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void => {
    const correlationId = req.correlationId || 'unknown';

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const validationError = mapZodError(err);
        const response: ErrorResponse = {
            error: validationError.toJSON(),
        };

        logger.warn('Validation error', {
            correlationId,
            path: req.path,
            method: req.method,
            details: validationError.details,
        });

        res.status(validationError.statusCode).json(response);
        return;
    }

    // Handle domain errors
    if (isDomainError(err)) {
        const response: ErrorResponse = {
            error: err.toJSON(),
        };

        logger.warn('Domain error', {
            correlationId,
            path: req.path,
            method: req.method,
            code: err.code,
            message: err.message,
        });

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle unknown errors - log full details, return generic message
    logger.error('Unhandled error', err, {
        correlationId,
        path: req.path,
        method: req.method,
    });

    const response: ErrorResponse = {
        error: {
            code: 'INTERNAL_ERROR',
            message: config.isDev ? err.message : 'An unexpected error occurred',
            retryable: true,
        },
    };

    res.status(500).json(response);
};

/**
 * 404 Not Found handler
 * Must be registered AFTER all routes but BEFORE error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    const response: ErrorResponse = {
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            retryable: false,
        },
    };

    res.status(404).json(response);
};
