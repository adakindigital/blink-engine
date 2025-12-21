// =============================================================================
// Blink Engine - User Repository
// =============================================================================
// User data access layer

import { prisma } from '../config/database.js';

// =============================================================================
// Types
// =============================================================================

export interface UserWithoutPassword {
    id: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber: string | null;
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
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                phoneNumber: true,
                isPhoneValidated: true,
                isEmailValidated: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }

    /**
     * Find user by email (without password)
     */
    async findByEmail(email: string): Promise<UserWithoutPassword | null> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                phoneNumber: true,
                isPhoneValidated: true,
                isEmailValidated: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }

    /**
     * Find user by email with password (for authentication)
     */
    async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
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
        await prisma.user.delete({
            where: { id },
        });
    }
}

export const userRepository = new UserRepository();
