
import { Result, ok, fail } from '../utils/result.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { socketService } from './socket.service.js';
import { DomainError } from '../domain/errors/domain.errors.js';

// =============================================================================
// Errors
// =============================================================================

export class SecurityError extends DomainError {
    readonly code = 'SECURITY_ERROR';
    readonly statusCode = 400;
    readonly retryable = false;

    constructor(message: string) {
        super(message);
    }
}

// =============================================================================
// Types
// =============================================================================

interface LocationUpdate {
    latitude: number;
    longitude: number;
}

interface SecurityAlert {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    triggeredAt: Date;
    distance?: number; // Distance from personnel in meters
}

// =============================================================================
// Service
// =============================================================================

class SecurityService {
    /**
     * Get active, unclaimed SOS events near a location
     * Only returns events from Premium users (enforced by product logic, though schema allows all)
     * For MVP, we fetch all active unclaimed and filter/sort by distance in memory
     */
    async getNearbyAlerts(latitude: number, longitude: number, radiusKm: number = 50): Promise<Result<SecurityAlert[], SecurityError>> {
        try {
            // Fetch active, unclaimed events
            // We also filter for Premium users if required, but let's assume all SOS for now or check user plan
            const activeEvents = await prisma.sosEvent.findMany({
                where: {
                    status: 'active',
                    securityResponderId: null, // Unclaimed
                    user: {
                        isPremium: true // Only premium users get security dispatch
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            isPremium: true
                        }
                    }
                }
            });

            // Calculate distance and filter
            const alerts: SecurityAlert[] = activeEvents
                .map(event => {
                    const dist = this.calculateDistance(latitude, longitude, event.latitude, event.longitude);
                    return {
                        id: event.id,
                        userId: event.userId,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        triggeredAt: event.triggeredAt,
                        distance: dist
                    };
                })
                .filter(a => a.distance! <= radiusKm * 1000) // Convert km to meters
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));

            return ok(alerts);
        } catch (error) {
            logger.error('Failed to get nearby alerts', error);
            return fail(new SecurityError('Failed to fetch alerts'));
        }
    }

    /**
     * Claim an SOS event
     */
    async claimAlert(alertId: string, personnelId: string): Promise<Result<void, SecurityError>> {
        try {
            // Transaction to ensure atomicity
            await prisma.$transaction(async (tx) => {
                const alert = await tx.sosEvent.findUnique({
                    where: { id: alertId }
                });

                if (!alert) throw new SecurityError('Alert not found');
                if (alert.status !== 'active') throw new SecurityError('Alert is no longer active');
                if (alert.securityResponderId) throw new SecurityError('Alert already claimed');

                // Update Alert
                await tx.sosEvent.update({
                    where: { id: alertId },
                    data: {
                        securityResponderId: personnelId,
                        securityStatus: 'dispatched',
                        updatedAt: new Date()
                    }
                });

                // Update Personnel Status
                await tx.securityPersonnel.update({
                    where: { id: personnelId },
                    data: {
                        status: 'busy',
                        updatedAt: new Date()
                    }
                });
            });

            // Notify User via Socket
            const alert = await prisma.sosEvent.findUnique({ where: { id: alertId } });
            if (alert) {
                socketService.emitToUsers([alert.userId], 'sos:security_update', {
                    status: 'dispatched',
                    personnelId
                });
            }

            return ok(undefined);
        } catch (error) {
            logger.error(`Failed to claim alert ${alertId}`, error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            return fail(new SecurityError(msg));
        }
    }

    /**
     * Update status of a dispatch (e.g., On Way, Arrived)
     */
    async updateDispatchStatus(alertId: string, status: string, personnelId: string): Promise<Result<void, SecurityError>> {
        try {
            const alert = await prisma.sosEvent.findUnique({ where: { id: alertId } });
            if (!alert) return fail(new SecurityError('Alert not found'));
            if (alert.securityResponderId !== personnelId) return fail(new SecurityError('Not authorized for this alert'));

            await prisma.sosEvent.update({
                where: { id: alertId },
                data: {
                    securityStatus: status,
                    updatedAt: new Date()
                }
            });

            // Notify User
            socketService.emitToUsers([alert.userId], 'sos:security_update', {
                status: status,
                personnelId
            });

            return ok(undefined);
        } catch (error) {
            logger.error('Failed to update dispatch status', error);
            return fail(new SecurityError('Failed to update status'));
        }
    }

    /**
     * Update personnel location
     */
    async updateLocation(personnelId: string, location: LocationUpdate): Promise<Result<void, SecurityError>> {
        try {
            await prisma.securityPersonnel.update({
                where: { id: personnelId },
                data: {
                    currentLatitude: location.latitude,
                    currentLongitude: location.longitude,
                    lastLocationUpdate: new Date()
                }
            });

            // If personnel is assigned to an active SOS, push location to that user
            const activeAssignment = await prisma.sosEvent.findFirst({
                where: {
                    securityResponderId: personnelId,
                    status: 'active',
                    securityStatus: { not: 'resolved' }
                }
            });

            if (activeAssignment) {
                socketService.emitToUsers([activeAssignment.userId], 'sos:security_location', {
                    personnelId,
                    latitude: location.latitude,
                    longitude: location.longitude
                });
            }

            return ok(undefined);
        } catch (error) {
            logger.error('Failed to update location', error);
            return fail(new SecurityError('Failed to update location'));
        }
    }

    /**
     * Helpers
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Get security personnel mission history
     */
    async getMissionHistory(personnelId: string): Promise<Result<any[], SecurityError>> {
        try {
            const missions = await prisma.sosEvent.findMany({
                where: {
                    securityResponderId: personnelId,
                    securityStatus: 'resolved'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            surname: true,
                            profileImageUrl: true
                        }
                    },
                    missionFeedback: true
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });

            return ok(missions);
        } catch (error) {
            logger.error('Failed to get mission history', error);
            return fail(new SecurityError('Failed to fetch mission history'));
        }
    }

    /**
     * Submit mission feedback
     */
    async submitFeedback(alertId: string, personnelId: string, rating: number, comment: string): Promise<Result<void, SecurityError>> {
        try {
            const alert = await prisma.sosEvent.findUnique({ where: { id: alertId } });

            if (!alert) return fail(new SecurityError('Alert not found'));

            // Allow feedback only if the responder was assigned
            if (alert.securityResponderId !== personnelId) {
                return fail(new SecurityError('Not authorized to submit feedback for this mission'));
            }

            const personnel = await prisma.securityPersonnel.findUnique({ where: { id: personnelId } });
            if (!personnel) return fail(new SecurityError('Personnel not found'));

            await prisma.missionFeedback.create({
                data: {
                    sosEventId: alertId,
                    fromUserId: personnel.userId,
                    rating,
                    comment,
                    type: 'security'
                }
            });

            return ok(undefined);
        } catch (error) {
            // Check for unique constraint violation (duplicate feedback)
            if ((error as any).code === 'P2002') {
                return fail(new SecurityError('Feedback already submitted for this mission'));
            }
            logger.error('Failed to submit feedback', error);
            return fail(new SecurityError('Failed to submit feedback'));
        }
    }
}

export const securityService = new SecurityService();
