// =============================================================================
// Blink Engine - SOS Repository
// =============================================================================
// SOS event data access layer

import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SosEvent {
    id: string;
    userId: string;
    triggeredAt: Date;
    cancelledAt: Date | null;
    resolvedAt: Date | null;
    latitude: number;
    longitude: number;
    status: string;
    notifiedContacts: Prisma.JsonValue;
    auditLog: Prisma.JsonValue;
    idempotencyKey: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateSosEventInput {
    userId: string;
    latitude: number;
    longitude: number;
    triggeredAt: Date;
    idempotencyKey?: string;
    notifiedContacts?: unknown[];
    auditLog?: unknown[];
}

// =============================================================================
// Repository
// =============================================================================

class SosRepository {
    /**
     * Find active SOS event for a user
     */
    async findActiveByUserId(userId: string): Promise<SosEvent | null> {
        return prisma.sosEvent.findFirst({
            where: {
                userId,
                status: 'active',
            },
        });
    }

    /**
     * Find SOS event by idempotency key
     */
    async findByIdempotencyKey(key: string): Promise<SosEvent | null> {
        return prisma.sosEvent.findUnique({
            where: { idempotencyKey: key },
        });
    }

    /**
     * Find all SOS events for a user
     */
    async findAllByUserId(userId: string): Promise<SosEvent[]> {
        return prisma.sosEvent.findMany({
            where: { userId },
            orderBy: { triggeredAt: 'desc' },
            take: 50, // Limit history
        });
    }

    /**
     * Create a new SOS event
     */
    async create(input: CreateSosEventInput): Promise<SosEvent> {
        return prisma.sosEvent.create({
            data: {
                userId: input.userId,
                latitude: input.latitude,
                longitude: input.longitude,
                triggeredAt: input.triggeredAt,
                idempotencyKey: input.idempotencyKey,
                notifiedContacts: input.notifiedContacts as Prisma.InputJsonValue,
                auditLog: input.auditLog as Prisma.InputJsonValue,
                status: 'active',
            },
        });
    }

    /**
     * Cancel an SOS event
     */
    async cancel(id: string, reason?: string): Promise<SosEvent> {
        const existing = await prisma.sosEvent.findUnique({ where: { id } });
        const currentAuditLog = (existing?.auditLog as unknown[]) || [];

        return prisma.sosEvent.update({
            where: { id },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
                auditLog: [
                    ...currentAuditLog,
                    {
                        action: 'CANCELLED',
                        reason,
                        timestamp: new Date().toISOString(),
                    },
                ] as Prisma.InputJsonValue,
            },
        });
    }

    /**
     * Resolve an SOS event
     */
    async resolve(id: string): Promise<SosEvent> {
        const existing = await prisma.sosEvent.findUnique({ where: { id } });
        const currentAuditLog = (existing?.auditLog as unknown[]) || [];

        return prisma.sosEvent.update({
            where: { id },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
                auditLog: [
                    ...currentAuditLog,
                    {
                        action: 'RESOLVED',
                        timestamp: new Date().toISOString(),
                    },
                ] as Prisma.InputJsonValue,
            },
        });
    }

    /**
     * Add entry to audit log
     */
    async addAuditEntry(id: string, entry: Record<string, unknown>): Promise<void> {
        const existing = await prisma.sosEvent.findUnique({ where: { id } });
        const currentAuditLog = (existing?.auditLog as unknown[]) || [];

        await prisma.sosEvent.update({
            where: { id },
            data: {
                auditLog: [...currentAuditLog, entry] as Prisma.InputJsonValue,
            },
        });
    }

    /**
     * Find active SOS events for multiple users
     * Used for checking circle (contacts) SOS status
     */
    async findActiveByUserIds(userIds: string[]): Promise<SosEvent[]> {
        return prisma.sosEvent.findMany({
            where: {
                userId: { in: userIds },
                status: 'active',
            },
        });
    }
}

export const sosRepository = new SosRepository();
