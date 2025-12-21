// =============================================================================
// Blink Engine - Authentication Middleware
// =============================================================================
// JWT validation and user identity resolution at API boundary

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { TokenExpiredError, TokenInvalidError, UnauthorizedError } from '../domain/errors/domain.errors.js';
import { logger } from '../utils/logger.js';

/**
 * JWT payload structure
 */
export interface JwtPayload {
    sub: string; // User ID
    email: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
        }
    }
}

/**
 * Extract Bearer token from Authorization header
 */
const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return null;

    return token;
};

/**
 * Verify and decode JWT token
 */
const verifyToken = (token: string): JwtPayload => {
    try {
        const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
        return payload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new TokenExpiredError();
        }
        throw new TokenInvalidError();
    }
};

/**
 * Authentication middleware - requires valid JWT
 * Must be applied to protected routes
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req);

    if (!token) {
        throw new UnauthorizedError('No authentication token provided');
    }

    const payload = verifyToken(token);

    // Attach user identity to request
    req.userId = payload.sub;
    req.userEmail = payload.email;

    logger.debug('User authenticated', {
        correlationId: req.correlationId,
        userId: payload.sub,
    });

    next();
};

/**
 * Optional authentication middleware
 * Attaches user identity if token is present, but doesn't require it
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
    const token = extractToken(req);

    if (token) {
        try {
            const payload = verifyToken(token);
            req.userId = payload.sub;
            req.userEmail = payload.email;
        } catch {
            // Token invalid but that's okay for optional auth
            logger.debug('Optional auth - invalid token ignored', {
                correlationId: req.correlationId,
            });
        }
    }

    next();
};

/**
 * Parse duration string to seconds
 */
const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value;
        case 'm':
            return value * 60;
        case 'h':
            return value * 60 * 60;
        case 'd':
            return value * 60 * 60 * 24;
        default:
            return 900;
    }
};

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, email: string): string => {
    return jwt.sign({ sub: userId, email }, config.jwt.accessSecret, {
        expiresIn: parseDuration(config.jwt.accessExpiresIn),
    });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, family: string): string => {
    return jwt.sign({ sub: userId, family }, config.jwt.refreshSecret, {
        expiresIn: parseDuration(config.jwt.refreshExpiresIn),
    });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { sub: string; family: string } => {
    try {
        const payload = jwt.verify(token, config.jwt.refreshSecret) as { sub: string; family: string };
        return payload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new TokenExpiredError();
        }
        throw new TokenInvalidError();
    }
};
