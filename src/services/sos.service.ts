// =============================================================================
// Blink Engine - SOS Service
// =============================================================================
// Safety-critical SOS business logic with audit logging

import { Result, ok, fail } from '../utils/result.js';
import {
    SosAlreadyActiveError,
    SosNotActiveError,
    DomainError,
} from '../domain/errors/domain.errors.js';
import { sosRepository, SosEvent } from '../repositories/sos.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { contactService } from './contact.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Types
// =============================================================================

interface TriggerSosInput {
    latitude: number;
    longitude: number;
    idempotencyKey?: string;
}

interface AuditContext {
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
}

// =============================================================================
// Service
// =============================================================================

class SosService {
    /**
     * Trigger an SOS event
     * This operation is idempotent - same idempotencyKey returns same result
     */
    async triggerSos(
        userId: string,
        input: TriggerSosInput,
        context: AuditContext
    ): Promise<Result<SosEvent, DomainError>> {
        // Check for idempotency
        if (input.idempotencyKey) {
            const existing = await sosRepository.findByIdempotencyKey(input.idempotencyKey);
            if (existing) {
                logger.info('SOS trigger - idempotent hit', {
                    correlationId: context.correlationId,
                    userId,
                    sosId: existing.id,
                });
                return ok(existing);
            }
        }

        // Check if user already has an active SOS
        const activeSos = await sosRepository.findActiveByUserId(userId);
        if (activeSos) {
            return fail(new SosAlreadyActiveError());
        }

        // Get primary contacts to notify
        const contacts = await contactService.getPrimaryContacts(userId);
        const notifiedContacts = contacts.map((c) => ({
            id: c.id,
            name: c.name,
            phoneNumber: c.phoneNumber,
        }));

        // Create SOS event
        const sosEvent = await sosRepository.create({
            userId,
            latitude: input.latitude,
            longitude: input.longitude,
            triggeredAt: new Date(),
            idempotencyKey: input.idempotencyKey,
            notifiedContacts: notifiedContacts,
            auditLog: [
                {
                    action: 'TRIGGERED',
                    timestamp: new Date().toISOString(),
                    correlationId: context.correlationId,
                },
            ],
        });

        // Record audit log
        await auditRepository.create({
            userId,
            action: 'SOS_TRIGGERED',
            resourceType: 'SosEvent',
            resourceId: sosEvent.id,
            metadata: {
                latitude: input.latitude,
                longitude: input.longitude,
                contactsNotified: notifiedContacts.length,
            },
            correlationId: context.correlationId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });

        // TODO: Trigger actual notifications (push, SMS, etc.)
        // This would be handled by a notification service

        return ok(sosEvent);
    }

    /**
     * Cancel an active SOS event
     */
    async cancelSos(
        userId: string,
        reason: string | undefined,
        context: AuditContext
    ): Promise<Result<SosEvent, DomainError>> {
        const activeSos = await sosRepository.findActiveByUserId(userId);
        if (!activeSos) {
            return fail(new SosNotActiveError());
        }

        // Update SOS event
        const cancelledSos = await sosRepository.cancel(activeSos.id, reason);

        // Record audit log
        await auditRepository.create({
            userId,
            action: 'SOS_CANCELLED',
            resourceType: 'SosEvent',
            resourceId: activeSos.id,
            metadata: { reason },
            correlationId: context.correlationId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });

        return ok(cancelledSos);
    }

    /**
     * Resolve an active SOS event (user confirms safety)
     */
    async resolveSos(
        userId: string,
        context: AuditContext
    ): Promise<Result<SosEvent, DomainError>> {
        const activeSos = await sosRepository.findActiveByUserId(userId);
        if (!activeSos) {
            return fail(new SosNotActiveError());
        }

        // Update SOS event
        const resolvedSos = await sosRepository.resolve(activeSos.id);

        // Record audit log
        await auditRepository.create({
            userId,
            action: 'SOS_RESOLVED',
            resourceType: 'SosEvent',
            resourceId: activeSos.id,
            correlationId: context.correlationId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });

        return ok(resolvedSos);
    }

    /**
     * Get active SOS for a user
     */
    async getActiveSos(userId: string): Promise<Result<SosEvent | null, DomainError>> {
        const activeSos = await sosRepository.findActiveByUserId(userId);
        return ok(activeSos);
    }

    /**
     * Get SOS history for a user
     */
    async getSosHistory(userId: string): Promise<Result<SosEvent[], DomainError>> {
        const history = await sosRepository.findAllByUserId(userId);
        return ok(history);
    }
}

export const sosService = new SosService();
