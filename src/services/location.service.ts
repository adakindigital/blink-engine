// =============================================================================
// Blink Engine - Location Service
// =============================================================================
// Location tracking business logic

import { Result, ok } from '../utils/result.js';
import { DomainError } from '../domain/errors/domain.errors.js';
import { locationRepository, Location } from '../repositories/location.repository.js';

import { userRepository } from '../repositories/user.repository.js';
import { contactRepository } from '../repositories/contact.repository.js';
// Placeholder for SocketService until implemented
import { socketService } from './socket.service.js';

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
     * Update user location and broadcast based on privacy rules
     * Rule: If isTracking is OFF, save but don't broadcast.
     * Rule: If isTracking is ON, broadcast only to contacts who ALSO have isTracking ON.
     */
    async updateLocation(
        userId: string,
        input: RecordLocationInput
    ): Promise<Result<Location, DomainError>> {
        // 1. Save location to DB
        const location = await locationRepository.create({
            userId,
            ...input,
        });

        // 2. Fetch User Settings
        const user = await userRepository.findById(userId);
        if (!user) {
            // Should not happen if auth middleware worked, but safety first
            return ok(location);
        }

        // 3. Privacy Enforcement
        if (!user.isTracking) {
            // User has disabled live tracking. Do not broadcast.
            return ok(location);
        }

        // 4. Find recipients (Hard Permission Enforcement)
        // Fetch all contacts
        const contacts = await contactRepository.findAllByUserId(userId);

        // We need to check if these contacts ALSO have isTracking enabled.
        // We need to fetch the User record for each contact.
        // Optimization: In a real app, do a join or `findMany` with `in`.
        // Here we iterate (assuming circle size is small, < 20).

        const recipientIds: string[] = [];

        for (const contact of contacts) {
            if (contact.contactUserId) {
                const contactUser = await userRepository.findById(contact.contactUserId);
                if (contactUser && contactUser.isTracking) {
                    recipientIds.push(contactUser.id);
                }
            }
        }

        // 5. Broadcast via WebSocket
        if (recipientIds.length > 0) {
            socketService.emitToUsers(recipientIds, 'location:update', {
                userId: user.id,
                location: {
                    lat: location.latitude,
                    lng: location.longitude,
                    timestamp: location.timestamp,
                    speed: location.speed,
                    heading: location.heading
                }
            });
        }

        return ok(location);
    }

    /**
     * Record a single location point (Legacy / Direct DB)
     */
    async recordLocation(
        userId: string,
        input: RecordLocationInput
    ): Promise<Result<Location, DomainError>> {
        return this.updateLocation(userId, input);
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
