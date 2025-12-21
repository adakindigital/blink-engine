// =============================================================================
// Blink Engine - Location Repository
// =============================================================================
// Location tracking data access layer

import { prisma } from '../config/database.js';

// =============================================================================
// Types
// =============================================================================

export interface Location {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    timestamp: Date;
    createdAt: Date;
}

interface CreateLocationInput {
    userId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
}

// =============================================================================
// Repository
// =============================================================================

class LocationRepository {
    /**
     * Create a single location record
     */
    async create(input: CreateLocationInput): Promise<Location> {
        return prisma.location.create({
            data: input,
        });
    }

    /**
     * Create multiple location records (batch)
     */
    async createMany(inputs: CreateLocationInput[]): Promise<number> {
        const result = await prisma.location.createMany({
            data: inputs,
        });
        return result.count;
    }

    /**
     * Find locations for a user within a time range
     */
    async findByUserIdWithRange(
        userId: string,
        from?: Date,
        to?: Date,
        limit = 100
    ): Promise<Location[]> {
        const where: {
            userId: string;
            timestamp?: { gte?: Date; lte?: Date };
        } = { userId };

        if (from || to) {
            where.timestamp = {};
            if (from) where.timestamp.gte = from;
            if (to) where.timestamp.lte = to;
        }

        return prisma.location.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    /**
     * Find the latest location for a user
     */
    async findLatestByUserId(userId: string): Promise<Location | null> {
        return prisma.location.findFirst({
            where: { userId },
            orderBy: { timestamp: 'desc' },
        });
    }

    /**
     * Delete old location records (data retention)
     */
    async deleteOlderThan(date: Date): Promise<number> {
        const result = await prisma.location.deleteMany({
            where: {
                timestamp: { lt: date },
            },
        });
        return result.count;
    }
}

export const locationRepository = new LocationRepository();
