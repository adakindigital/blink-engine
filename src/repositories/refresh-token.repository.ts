// =============================================================================
// Blink Engine - Refresh Token Repository
// =============================================================================
// Refresh token data access layer

import { prisma } from '../config/database.js';

// =============================================================================
// Types
// =============================================================================

interface RefreshToken {
    id: string;
    token: string;
    userId: string;
    family: string;
    expiresAt: Date;
    revoked: boolean;
    createdAt: Date;
}

interface CreateRefreshTokenInput {
    token: string;
    userId: string;
    family: string;
    expiresAt: Date;
}

// =============================================================================
// Repository
// =============================================================================

class RefreshTokenRepository {
    /**
     * Find refresh token by token value
     */
    async findByToken(token: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findUnique({
            where: { token },
        });
    }

    /**
     * Create a new refresh token
     */
    async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
        return prisma.refreshToken.create({
            data: input,
        });
    }

    /**
     * Revoke a single token
     */
    async revoke(id: string): Promise<void> {
        await prisma.refreshToken.update({
            where: { id },
            data: { revoked: true },
        });
    }

    /**
     * Revoke all tokens in a family (token rotation breach detected)
     */
    async revokeFamily(family: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { family },
            data: { revoked: true },
        });
    }

    /**
     * Revoke all tokens for a user (logout)
     */
    async revokeAllForUser(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
        });
    }

    /**
     * Delete expired tokens (cleanup job)
     */
    async deleteExpired(): Promise<number> {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
            },
        });
        return result.count;
    }
}

export const refreshTokenRepository = new RefreshTokenRepository();
