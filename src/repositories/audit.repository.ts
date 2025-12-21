// =============================================================================
// Blink Engine - Audit Repository
// =============================================================================
// Audit log data access layer for safety-critical operations

import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    metadata: Prisma.JsonValue;
    ipAddress: string | null;
    userAgent: string | null;
    correlationId: string | null;
    createdAt: Date;
}

interface CreateAuditLogInput {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
}

// =============================================================================
// Repository
// =============================================================================

class AuditRepository {
    /**
     * Create an audit log entry
     */
    async create(input: CreateAuditLogInput): Promise<AuditLog> {
        return prisma.auditLog.create({
            data: {
                userId: input.userId,
                action: input.action,
                resourceType: input.resourceType,
                resourceId: input.resourceId,
                metadata: input.metadata as Prisma.InputJsonValue,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                correlationId: input.correlationId,
            },
        });
    }

    /**
     * Find audit logs by user ID
     */
    async findByUserId(userId: string, limit = 100): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Find audit logs by correlation ID
     */
    async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: { correlationId },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Find audit logs by resource
     */
    async findByResource(
        resourceType: string,
        resourceId: string
    ): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: { resourceType, resourceId },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Find audit logs by action
     */
    async findByAction(action: string, limit = 100): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: { action },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

export const auditRepository = new AuditRepository();
