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
    contactUserId: string | null;
    name: string;
    phoneNumber: string;
    email: string | null;
    isPrimary: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContactInvite {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateContactInput {
    userId: string;
    contactUserId?: string;
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
        }) as unknown as Contact[];
    }

    /**
     * Find contact by ID and user ID (ownership check)
     */
    async findByIdAndUserId(id: string, userId: string): Promise<Contact | null> {
        return prisma.contact.findFirst({
            where: { id, userId },
        }) as unknown as Contact | null;
    }

    /**
     * Find primary contacts for a user
     */
    async findPrimaryByUserId(userId: string): Promise<Contact[]> {
        return prisma.contact.findMany({
            where: { userId, isPrimary: true },
        }) as unknown as Contact[];
    }

    /**
     * Create a new contact
     */
    async create(input: CreateContactInput): Promise<Contact> {
        return prisma.contact.create({
            data: input,
        }) as unknown as Contact;
    }

    /**
     * Update a contact
     */
    async update(id: string, input: UpdateContactInput): Promise<Contact> {
        return prisma.contact.update({
            where: { id },
            data: input,
        }) as unknown as Contact;
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

    // =============================================================================
    // Invite Methods
    // =============================================================================

    async createInvite(senderId: string, receiverId: string): Promise<ContactInvite> {
        return prisma.contactInvite.create({
            data: {
                senderId,
                receiverId,
                status: 'pending',
            },
        });
    }

    async findPendingInvitesByReceiverId(receiverId: string): Promise<ContactInvite[]> {
        return prisma.contactInvite.findMany({
            where: {
                receiverId,
                status: 'pending',
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findInviteById(id: string): Promise<ContactInvite | null> {
        return prisma.contactInvite.findUnique({
            where: { id },
        });
    }

    async updateInviteStatus(id: string, status: string): Promise<ContactInvite> {
        return prisma.contactInvite.update({
            where: { id },
            data: { status },
        });
    }

    async findExistingInvite(senderId: string, receiverId: string): Promise<ContactInvite | null> {
        return prisma.contactInvite.findFirst({
            where: {
                senderId,
                receiverId,
                status: 'pending',
            },
        });
    }
}

export const contactRepository = new ContactRepository();
