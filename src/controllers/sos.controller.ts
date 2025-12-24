// =============================================================================
// Blink Engine - SOS Controller
// =============================================================================
// Safety-critical SOS HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sosService } from '../services/sos.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Request Schemas
// =============================================================================

export const triggerSosSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    idempotencyKey: z.string().uuid().optional(),
});

export const cancelSosSchema = z.object({
    reason: z.string().optional(),
});

// =============================================================================
// Request Types
// =============================================================================

export type TriggerSosRequest = z.infer<typeof triggerSosSchema>;
export type CancelSosRequest = z.infer<typeof cancelSosSchema>;

// =============================================================================
// Handlers
// =============================================================================

/**
 * POST /v1/sos/trigger
 * Trigger an SOS event
 * This is an idempotent operation - multiple calls with the same idempotencyKey
 * will return the same result
 */
export const triggerSos = async (
    req: Request<unknown, unknown, TriggerSosRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.triggerSos(userId, req.body, {
            correlationId: req.correlationId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        if (!result.success) {
            throw result.error;
        }

        // Always log SOS triggers - safety critical
        logger.info('SOS triggered', {
            correlationId: req.correlationId,
            userId,
            sosId: result.data.id,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
        });

        res.status(201).json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/sos/cancel
 * Cancel an active SOS event
 */
export const cancelSos = async (
    req: Request<unknown, unknown, CancelSosRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.cancelSos(userId, req.body.reason, {
            correlationId: req.correlationId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        if (!result.success) {
            throw result.error;
        }

        // Always log SOS cancellations - safety critical
        logger.info('SOS cancelled', {
            correlationId: req.correlationId,
            userId,
            sosId: result.data.id,
            reason: req.body.reason,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/sos/resolve
 * Resolve an SOS event (user is safe)
 */
export const resolveSos = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.resolveSos(userId, {
            correlationId: req.correlationId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        if (!result.success) {
            throw result.error;
        }

        // Always log SOS resolutions - safety critical
        logger.info('SOS resolved', {
            correlationId: req.correlationId,
            userId,
            sosId: result.data.id,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/sos/active
 * Get the active SOS event for the current user
 */
export const getActiveSos = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.getActiveSos(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/sos/history
 * Get SOS event history
 */
export const getSosHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.getSosHistory(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/sos/circle-status
 * Get active SOS events from the user's trusted circle (emergency contacts)
 * Returns a list of contacts who have active SOS events
 */
export const getCircleSosStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await sosService.getCircleSosStatus(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};
