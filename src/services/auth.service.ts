// =============================================================================
// Blink Engine - Auth Service
// =============================================================================
// Authentication business logic

import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Result, ok, fail } from '../utils/result.js';
import { config } from '../config/index.js';
import {
    InvalidCredentialsError,
    EmailAlreadyExistsError,
    NotFoundError,
    RefreshTokenRevokedError,
    DomainError,
} from '../domain/errors/domain.errors.js';
import { userRepository, UserWithoutPassword } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refresh-token.repository.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../middleware/auth.middleware.js';

// =============================================================================
// Types
// =============================================================================

interface RegisterInput {
    email: string;
    password: string;
    name: string;
    surname: string;
    phoneNumber?: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface AuthResponse {
    user: UserWithoutPassword;
    tokens: AuthTokens;
}

// =============================================================================
// Service
// =============================================================================

class AuthService {
    /**
     * Register a new user
     */
    async register(input: RegisterInput): Promise<Result<AuthResponse, DomainError>> {
        // Normalize email to lowercase
        const email = input.email.toLowerCase();

        // Check if email already exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            return fail(new EmailAlreadyExistsError());
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);

        // Create user
        const user = await userRepository.create({
            email,
            passwordHash,
            name: input.name,
            surname: input.surname,
            phoneNumber: input.phoneNumber,
        });

        // Generate tokens
        const tokens = await this.createTokens(user.id, user.email);

        return ok({
            user,
            tokens,
        });
    }

    /**
     * Authenticate user with email and password
     */
    async login(email: string, password: string): Promise<Result<AuthResponse, DomainError>> {
        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Find user by email
        const user = await userRepository.findByEmailWithPassword(normalizedEmail);
        if (!user) {
            return fail(new InvalidCredentialsError());
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return fail(new InvalidCredentialsError());
        }

        // Generate tokens
        const tokens = await this.createTokens(user.id, user.email);

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;

        return ok({
            user: userWithoutPassword,
            tokens,
        });
    }

    /**
     * Refresh tokens using a valid refresh token
     * Implements token rotation - old token is revoked, new one is issued
     */
    async refreshTokens(refreshToken: string): Promise<Result<AuthTokens, DomainError>> {
        // Verify the token signature
        const payload = verifyRefreshToken(refreshToken);

        // Find the token in database
        const storedToken = await refreshTokenRepository.findByToken(refreshToken);
        if (!storedToken) {
            return fail(new RefreshTokenRevokedError());
        }

        // Check if token is revoked
        if (storedToken.revoked) {
            // Token reuse detected! Revoke all tokens in this family
            await refreshTokenRepository.revokeFamily(storedToken.family);
            return fail(new RefreshTokenRevokedError());
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            return fail(new RefreshTokenRevokedError());
        }

        // Revoke the old token
        await refreshTokenRepository.revoke(storedToken.id);

        // Get user
        const user = await userRepository.findById(payload.sub);
        if (!user) {
            return fail(new NotFoundError('User'));
        }

        // Generate new tokens with the same family
        const tokens = await this.createTokens(user.id, user.email, storedToken.family);

        return ok(tokens);
    }

    /**
     * Logout - revoke all refresh tokens for user
     */
    async logout(userId: string): Promise<void> {
        await refreshTokenRepository.revokeAllForUser(userId);
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(userId: string): Promise<Result<UserWithoutPassword, DomainError>> {
        const user = await userRepository.findById(userId);
        if (!user) {
            return fail(new NotFoundError('User'));
        }
        return ok(user);
    }

    /**
     * Create access and refresh tokens
     */
    private async createTokens(
        userId: string,
        email: string,
        family?: string
    ): Promise<AuthTokens> {
        const tokenFamily = family || randomUUID();

        // Generate tokens
        const accessToken = generateAccessToken(userId, email);
        const refreshToken = generateRefreshToken(userId, tokenFamily);

        // Calculate expiry (parse duration string like "7d")
        const expiresIn = this.parseDuration(config.jwt.refreshExpiresIn);
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        // Store refresh token
        await refreshTokenRepository.create({
            token: refreshToken,
            userId,
            family: tokenFamily,
            expiresAt,
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseDuration(config.jwt.accessExpiresIn),
        };
    }

    /**
     * Parse duration string to seconds
     */
    private parseDuration(duration: string): number {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) return 900; // Default 15 minutes

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                return 900;
        }
    }
}

export const authService = new AuthService();
