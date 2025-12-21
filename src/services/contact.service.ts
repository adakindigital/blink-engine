// =============================================================================
// Blink Engine - Contact Service
// =============================================================================
// Emergency contact business logic

import { Result, ok, fail } from '../utils/result.js';
import { NotFoundError, DomainError } from '../domain/errors/domain.errors.js';
import { contactRepository, Contact } from '../repositories/contact.repository.js';

// =============================================================================
// Types
// =============================================================================

interface CreateContactInput {
    name: string;
    phoneNumber: string;
    email?: string;
    isPrimary?: boolean;
}

interface UpdateContactInput {
    name?: string;
    phoneNumber?: string;
    email?: string;
}

// =============================================================================
// Service
// =============================================================================

class ContactService {
    /**
     * List all contacts for a user
     */
    async listContacts(userId: string): Promise<Result<Contact[], DomainError>> {
        const contacts = await contactRepository.findAllByUserId(userId);
        return ok(contacts);
    }

    /**
     * Create a new emergency contact
     */
    async createContact(
        userId: string,
        input: CreateContactInput
    ): Promise<Result<Contact, DomainError>> {
        // If this is the first contact, make it primary
        const existingContacts = await contactRepository.findAllByUserId(userId);
        const isPrimary = input.isPrimary || existingContacts.length === 0;

        // If setting as primary, unset existing primary
        if (isPrimary && existingContacts.length > 0) {
            await contactRepository.unsetPrimaryForUser(userId);
        }

        const contact = await contactRepository.create({
            userId,
            name: input.name,
            phoneNumber: input.phoneNumber,
            email: input.email,
            isPrimary,
        });

        return ok(contact);
    }

    /**
     * Get a specific contact
     */
    async getContact(userId: string, contactId: string): Promise<Result<Contact, DomainError>> {
        const contact = await contactRepository.findByIdAndUserId(contactId, userId);
        if (!contact) {
            return fail(new NotFoundError('Contact', contactId));
        }
        return ok(contact);
    }

    /**
     * Update a contact
     */
    async updateContact(
        userId: string,
        contactId: string,
        input: UpdateContactInput
    ): Promise<Result<Contact, DomainError>> {
        const contact = await contactRepository.findByIdAndUserId(contactId, userId);
        if (!contact) {
            return fail(new NotFoundError('Contact', contactId));
        }

        const updatedContact = await contactRepository.update(contactId, input);
        return ok(updatedContact);
    }

    /**
     * Delete a contact
     */
    async deleteContact(userId: string, contactId: string): Promise<Result<void, DomainError>> {
        const contact = await contactRepository.findByIdAndUserId(contactId, userId);
        if (!contact) {
            return fail(new NotFoundError('Contact', contactId));
        }

        await contactRepository.delete(contactId);

        // If deleted contact was primary, set another as primary
        if (contact.isPrimary) {
            const remainingContacts = await contactRepository.findAllByUserId(userId);
            if (remainingContacts.length > 0) {
                await contactRepository.update(remainingContacts[0].id, { isPrimary: true });
            }
        }

        return ok(undefined);
    }

    /**
     * Set a contact as primary
     */
    async setPrimaryContact(
        userId: string,
        contactId: string
    ): Promise<Result<Contact, DomainError>> {
        const contact = await contactRepository.findByIdAndUserId(contactId, userId);
        if (!contact) {
            return fail(new NotFoundError('Contact', contactId));
        }

        // Unset existing primary
        await contactRepository.unsetPrimaryForUser(userId);

        // Set new primary
        const updatedContact = await contactRepository.update(contactId, { isPrimary: true });
        return ok(updatedContact);
    }

    /**
     * Get primary contacts for SOS notification
     */
    async getPrimaryContacts(userId: string): Promise<Contact[]> {
        return contactRepository.findPrimaryByUserId(userId);
    }
}

export const contactService = new ContactService();
