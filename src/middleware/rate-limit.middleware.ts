// =============================================================================
// Blink Engine - Rate Limiting Middleware
// =============================================================================
// Rate limiting with Redis or in-memory fallback

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Standard rate limiter for general API endpoints
 */
export const standardRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryable: true,
        },
    },
    handler: (req, res, _next, options) => {
        logger.warn('Rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json(options.message);
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * Lower limit to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    message: {
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
            retryable: true,
        },
    },
    handler: (req, res, _next, options) => {
        logger.warn('Auth rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json(options.message);
    },
});

/**
 * SOS rate limiter - higher limit but still protected
 */
export const sosRateLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 10, // 10 SOS actions per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'SOS_RATE_LIMIT_EXCEEDED',
            message: 'Too many SOS requests, please try again shortly',
            retryable: true,
        },
    },
    handler: (req, res, _next, options) => {
        logger.warn('SOS rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            userId: req.userId,
        });
        res.status(429).json(options.message);
    },
});
