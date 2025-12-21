// =============================================================================
// Blink Engine - User Repository
// =============================================================================
// User data access layer

import { prisma } from '../config/database.js';
import { DatabaseError } from '../domain/errors/domain.errors.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface UserWithoutPassword {
    id: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    isPremium: boolean;
    isPhoneValidated: boolean;
    isEmailValidated: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UserWithPassword extends UserWithoutPassword {
    passwordHash: string;
}

interface CreateUserInput {
    email: string;
    passwordHash: string;
    name: string;
    surname: string;
    phoneNumber?: string;
}

interface UpdateUserInput {
    name?: string;
    surname?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    isPhoneValidated?: boolean;
    isEmailValidated?: boolean;
}

// =============================================================================
// Repository
// =============================================================================

class UserRepository {
    /**
     * Find user by ID (without password)
     */
    async findById(id: string): Promise<UserWithoutPassword | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    surname: true,
                    phoneNumber: true,
                    profileImageUrl: true,
                    isPremium: true,
                    isPhoneValidated: true,
                    isEmailValidated: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return user;
        } catch (error) {
            this.handlePrismaError(error, 'findById');
            return null; // unreachable due to throw in handlePrismaError
        }
    }

    /**
     * Find user by email (without password)
     */
    async findByEmail(email: string): Promise<UserWithoutPassword | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    surname: true,
                    phoneNumber: true,
                    profileImageUrl: true,
                    isPremium: true,
                    isPhoneValidated: true,
                    isEmailValidated: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return user;
        } catch (error) {
            this.handlePrismaError(error, 'findByEmail');
            return null;
        }
    }

    /**
     * Find user by email with password (for authentication)
     */
    async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
            });
            return user;
        } catch (error) {
            this.handlePrismaError(error, 'findByEmailWithPassword');
            return null;
        }
    }

    /**
     * Create a new user
     */
    async create(input: CreateUserInput): Promise<UserWithoutPassword> {
        const user = await prisma.user.create({
            data: input,
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                phoneNumber: true,
                profileImageUrl: true,
                isPremium: true,
                isPhoneValidated: true,
                isEmailValidated: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }

    /**
     * Update a user
     */
    async update(id: string, input: UpdateUserInput): Promise<UserWithoutPassword> {
        const user = await prisma.user.update({
            where: { id },
            data: input,
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                phoneNumber: true,
                profileImageUrl: true,
                isPremium: true,
                isPhoneValidated: true,
                isEmailValidated: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }

    /**
     * Delete a user
     */
    async delete(id: string): Promise<void> {
        try {
            await prisma.user.delete({
                where: { id },
            });
        } catch (error) {
            this.handlePrismaError(error, 'delete');
        }
    }

    /**
     * Utility to handle Prisma errors and map to domain errors
     */
    private handlePrismaError(error: any, operation: string): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2021: The table {table} does not exist in the current database.
            // P2022: The column {column} does not exist in the current database.
            if (error.code === 'P2021' || error.code === 'P2022') {
                logger.error(`Database schema error during ${operation}: ${error.message}`, {
                    code: error.code,
                    meta: error.meta,
                });
                throw new DatabaseError('Database is currently undergoing maintenance. Please try again later.');
            }
        }

        logger.error(`Unexpected database error during ${operation}`, error);
        throw new DatabaseError();
    }
}

export const userRepository = new UserRepository();
