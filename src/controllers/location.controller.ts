// =============================================================================
// Blink Engine - Location Controller
// =============================================================================
// Location tracking HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { locationService } from '../services/location.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Request Schemas
// =============================================================================

export const recordLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive().optional(),
    altitude: z.number().optional(),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
    timestamp: z.string().datetime().or(z.date()).transform((val) => new Date(val)),
});

export const locationHistoryQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
});

// =============================================================================
// Request Types
// =============================================================================

export type RecordLocationRequest = z.infer<typeof recordLocationSchema>;
export type LocationHistoryQuery = z.infer<typeof locationHistoryQuerySchema>;

// =============================================================================
// Handlers
// =============================================================================

/**
 * POST /v1/locations
 * Record a single location point
 */
export const recordLocation = async (
    req: Request<unknown, unknown, RecordLocationRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await locationService.recordLocation(userId, req.body);

        if (!result.success) {
            throw result.error;
        }

        res.status(201).json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/locations/batch
 * Record multiple location points
 */
export const recordBatchLocations = async (
    req: Request<unknown, unknown, RecordLocationRequest[]>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await locationService.recordBatchLocations(userId, req.body);

        if (!result.success) {
            throw result.error;
        }

        logger.debug('Batch locations recorded', {
            correlationId: req.correlationId,
            userId,
            count: req.body.length,
        });

        res.status(201).json({ data: { count: result.data } });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/locations/history
 * Get location history
 */
export const getLocationHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const query = req.query as unknown as LocationHistoryQuery;
        const { from, to, limit } = query;

        const result = await locationService.getLocationHistory(userId, {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            limit: limit ?? 100,
        });

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/locations/latest
 * Get the latest location
 */
export const getLatestLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await locationService.getLatestLocation(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};
