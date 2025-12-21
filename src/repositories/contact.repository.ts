// =============================================================================
// Blink Engine - Contact Repository
// =============================================================================
// Emergency contact data access layer

import { prisma } from '../config/database.js';

// =============================================================================
// Types
// =============================================================================

export interface Contact {
    id: string;
    userId: string;
    name: string;
    phoneNumber: string;
    email: string | null;
    isPrimary: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateContactInput {
    userId: string;
    name: string;
    phoneNumber: string;
    email?: string;
    isPrimary?: boolean;
}

interface UpdateContactInput {
    name?: string;
    phoneNumber?: string;
    email?: string;
    isPrimary?: boolean;
    status?: string;
}

// =============================================================================
// Repository
// =============================================================================

class ContactRepository {
    /**
     * Find all contacts for a user
     */
    async findAllByUserId(userId: string): Promise<Contact[]> {
        return prisma.contact.findMany({
            where: { userId },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        });
    }

    /**
     * Find contact by ID and user ID (ownership check)
     */
    async findByIdAndUserId(id: string, userId: string): Promise<Contact | null> {
        return prisma.contact.findFirst({
            where: { id, userId },
        });
    }

    /**
     * Find primary contacts for a user
     */
    async findPrimaryByUserId(userId: string): Promise<Contact[]> {
        return prisma.contact.findMany({
            where: { userId, isPrimary: true },
        });
    }

    /**
     * Create a new contact
     */
    async create(input: CreateContactInput): Promise<Contact> {
        return prisma.contact.create({
            data: input,
        });
    }

    /**
     * Update a contact
     */
    async update(id: string, input: UpdateContactInput): Promise<Contact> {
        return prisma.contact.update({
            where: { id },
            data: input,
        });
    }

    /**
     * Delete a contact
     */
    async delete(id: string): Promise<void> {
        await prisma.contact.delete({
            where: { id },
        });
    }

    /**
     * Unset primary flag for all contacts of a user
     */
    async unsetPrimaryForUser(userId: string): Promise<void> {
        await prisma.contact.updateMany({
            where: { userId, isPrimary: true },
            data: { isPrimary: false },
        });
    }
}

export const contactRepository = new ContactRepository();
