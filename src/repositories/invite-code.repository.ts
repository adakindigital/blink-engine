// =============================================================================
// Blink Engine - Invite Code Repository
// =============================================================================
// Handles short-lived invite codes for secure contact adding

import { prisma } from '../config/database.js';
import type { InviteCode } from '@prisma/client';

/**
 * Generate a random 6-character alphanumeric code
 * Uses uppercase letters and numbers for readability
 */
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: 0/O, 1/I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class InviteCodeRepository {
    /**
     * Create a new invite code for a user
     * Code expires after the specified duration (default: 5 minutes)
     */
    async create(userId: string, expiresInMinutes: number = 5): Promise<InviteCode> {
        // Generate unique code (retry if collision)
        let code: string;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            code = generateCode();
            const existing = await prisma.inviteCode.findUnique({ where: { code } });
            if (!existing) break;
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique invite code');
        }

        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        return prisma.inviteCode.create({
            data: {
                code: code!,
                userId,
                expiresAt,
            },
        });
    }

    /**
     * Find a valid (unexpired, unused) invite code
     */
    async findValidByCode(code: string): Promise<InviteCode | null> {
        return prisma.inviteCode.findFirst({
            where: {
                code: code.toUpperCase(),
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
        });
    }

    /**
     * Mark an invite code as used
     */
    async markUsed(id: string): Promise<InviteCode> {
        return prisma.inviteCode.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    }

    /**
     * Get the most recent valid invite code for a user
     * Returns null if no valid code exists
     */
    async getActiveForUser(userId: string): Promise<InviteCode | null> {
        return prisma.inviteCode.findFirst({
            where: {
                userId,
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Invalidate all existing codes for a user (called when generating new code)
     */
    async invalidateAllForUser(userId: string): Promise<number> {
        const result = await prisma.inviteCode.updateMany({
            where: {
                userId,
                usedAt: null,
            },
            data: {
                usedAt: new Date(), // Mark as "used" to invalidate
            },
        });
        return result.count;
    }

    /**
     * Delete expired codes (cleanup job)
     */
    async deleteExpired(): Promise<number> {
        const result = await prisma.inviteCode.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
}

export const inviteCodeRepository = new InviteCodeRepository();
