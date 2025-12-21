// =============================================================================
// Blink Engine - Auth Controller
// =============================================================================
// Authentication HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Request Schemas
// =============================================================================

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    surname: z.string().min(1, 'Surname is required'),
    phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// =============================================================================
// Request Types
// =============================================================================

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshRequest = z.infer<typeof refreshSchema>;

// =============================================================================
// Handlers
// =============================================================================

/**
 * POST /v1/auth/register
 * Register a new user
 */
export const register = async (
    req: Request<unknown, unknown, RegisterRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.register(req.body);

        if (!result.success) {
            throw result.error;
        }

        logger.info('User registered', {
            correlationId: req.correlationId,
            userId: result.data.user.id,
        });

        res.status(201).json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/auth/login
 * Authenticate user and return tokens
 */
export const login = async (
    req: Request<unknown, unknown, LoginRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.login(req.body.email, req.body.password);

        if (!result.success) {
            throw result.error;
        }

        logger.info('User logged in', {
            correlationId: req.correlationId,
            userId: result.data.user.id,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/auth/refresh
 * Refresh access token using refresh token
 */
export const refresh = async (
    req: Request<unknown, unknown, RefreshRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.refreshTokens(req.body.refreshToken);

        if (!result.success) {
            throw result.error;
        }

        logger.debug('Tokens refreshed', {
            correlationId: req.correlationId,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/auth/logout
 * Revoke refresh token
 */
export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        await authService.logout(userId);

        logger.info('User logged out', {
            correlationId: req.correlationId,
            userId,
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/auth/me
 * Get current authenticated user
 */
export const me = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await authService.getCurrentUser(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};
