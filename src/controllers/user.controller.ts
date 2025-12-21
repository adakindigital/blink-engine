// =============================================================================
// Blink Engine - User Controller
// =============================================================================
// User profile HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Request Schemas
// =============================================================================

export const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    surname: z.string().min(1).optional(),
    phoneNumber: z.string().optional(),
});

// =============================================================================
// Request Types
// =============================================================================

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// =============================================================================
// Handlers
// =============================================================================

/**
 * GET /v1/users/profile
 * Get current user's profile
 */
export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await userService.getProfile(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /v1/users/profile
 * Update current user's profile
 */
export const updateProfile = async (
    req: Request<unknown, unknown, UpdateProfileRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await userService.updateProfile(userId, req.body);

        if (!result.success) {
            throw result.error;
        }

        logger.info('Profile updated', {
            correlationId: req.correlationId,
            userId,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};
