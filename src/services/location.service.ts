// =============================================================================
// Blink Engine - Location Service
// =============================================================================
// Location tracking business logic

import { Result, ok } from '../utils/result.js';
import { DomainError } from '../domain/errors/domain.errors.js';
import { locationRepository, Location } from '../repositories/location.repository.js';

// =============================================================================
// Types
// =============================================================================

interface RecordLocationInput {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
}

interface LocationHistoryOptions {
    from?: Date;
    to?: Date;
    limit?: number;
}

// =============================================================================
// Service
// =============================================================================

class LocationService {
    /**
     * Record a single location point
     */
    async recordLocation(
        userId: string,
        input: RecordLocationInput
    ): Promise<Result<Location, DomainError>> {
        const location = await locationRepository.create({
            userId,
            ...input,
        });
        return ok(location);
    }

    /**
     * Record multiple location points (batch)
     */
    async recordBatchLocations(
        userId: string,
        inputs: RecordLocationInput[]
    ): Promise<Result<number, DomainError>> {
        const count = await locationRepository.createMany(
            inputs.map((input) => ({ userId, ...input }))
        );
        return ok(count);
    }

    /**
     * Get location history for a user
     */
    async getLocationHistory(
        userId: string,
        options: LocationHistoryOptions
    ): Promise<Result<Location[], DomainError>> {
        const locations = await locationRepository.findByUserIdWithRange(
            userId,
            options.from,
            options.to,
            options.limit || 100
        );
        return ok(locations);
    }

    /**
     * Get the latest location for a user
     */
    async getLatestLocation(userId: string): Promise<Result<Location | null, DomainError>> {
        const location = await locationRepository.findLatestByUserId(userId);
        return ok(location);
    }
}

export const locationService = new LocationService();
