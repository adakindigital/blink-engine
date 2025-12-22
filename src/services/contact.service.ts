// =============================================================================
// Blink Engine - Contact Service
// =============================================================================
// Emergency contact business logic

import { Result, ok, fail } from '../utils/result.js';
import { NotFoundError, ConflictError, ValidationError, UnauthorizedError, DomainError } from '../domain/errors/domain.errors.js';
import { contactRepository, Contact, ContactInvite } from '../repositories/contact.repository.js';
import { userRepository } from '../repositories/user.repository.js';

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

        // Check for reciprocal contact to notify
        if (contact.contactUserId) {
            // Find the other user's contact entry that points to this user
            const otherUserContacts = await contactRepository.findAllByUserId(contact.contactUserId);
            const reciprocalContact = otherUserContacts.find(c => c.contactUserId === userId);

            if (reciprocalContact) {
                // Mark as disconnected so they get notified
                await contactRepository.update(reciprocalContact.id, { status: 'disconnected' });
            }
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

    // =============================================================================
    // Invite Logic
    // =============================================================================

    /**
     * Create a new invite
     */
    async createInvite(senderId: string, receiverId: string): Promise<Result<{ inviteId: string; status: string }, DomainError>> {
        if (senderId === receiverId) {
            return fail(new ValidationError('Cannot invite yourself'));
        }

        // Check if already friends
        const existingContacts = await contactRepository.findAllByUserId(senderId);
        const alreadyFriend = existingContacts.some(c => c.contactUserId === receiverId);
        if (alreadyFriend) {
            return fail(new ConflictError('User is already in your circle'));
        }

        // Check if existing pending invite
        const existingInvite = await contactRepository.findExistingInvite(senderId, receiverId);
        if (existingInvite) {
            return ok({ inviteId: existingInvite.id, status: existingInvite.status });
        }

        const invite = await contactRepository.createInvite(senderId, receiverId);
        return ok({ inviteId: invite.id, status: invite.status });
    }

    /**
     * Get invite by ID
     */
    async getInvite(inviteId: string): Promise<Result<ContactInvite, DomainError>> {
        const invite = await contactRepository.findInviteById(inviteId);
        if (!invite) {
            return fail(new NotFoundError('Invite', inviteId));
        }
        return ok(invite);
    }

    /**
     * Get incoming invites
     */
    async getIncomingInvites(userId: string): Promise<Result<any[], DomainError>> { // Return enriched invites
        const invites = await contactRepository.findPendingInvitesByReceiverId(userId);

        // Enrich with sender details
        // Note: In a real app we might want to do this efficiently with a join or simpler query
        const enriched = await Promise.all(invites.map(async (inv) => {
            const sender = await userRepository.findById(inv.senderId);
            return {
                id: inv.id,
                sender: sender ? {
                    name: sender.name,
                    surname: sender.surname,
                    profileImageUrl: sender.profileImageUrl
                } : null,
                createdAt: inv.createdAt
            };
        }));

        return ok(enriched.filter(e => e.sender !== null));
    }

    /**
     * Respond to an invite
     */
    async respondToInvite(userId: string, inviteId: string, accept: boolean): Promise<Result<void, DomainError>> {
        const invite = await contactRepository.findInviteById(inviteId);
        if (!invite) {
            return fail(new NotFoundError('Invite', inviteId));
        }

        if (invite.receiverId !== userId) {
            return fail(new UnauthorizedError('Not authorized to respond to this invite'));
        }

        if (invite.status !== 'pending') {
            return fail(new ValidationError('Invite is not pending'));
        }

        if (!accept) {
            await contactRepository.updateInviteStatus(inviteId, 'declined');
            return ok(undefined);
        }

        // Accepted logic
        const sender = await userRepository.findById(invite.senderId);
        const receiver = await userRepository.findById(invite.receiverId);

        if (!sender || !receiver) {
            return fail(new NotFoundError('User'));
        }

        // Create Mutual Contacts
        // Receiver adds Sender
        await contactRepository.create({
            userId: receiver.id,
            contactUserId: sender.id,
            name: `${sender.name} ${sender.surname}`.trim(),
            phoneNumber: sender.phoneNumber || '',
            email: sender.email,
            isPrimary: false,
        });

        // Sender adds Receiver
        await contactRepository.create({
            userId: sender.id,
            contactUserId: receiver.id,
            name: `${receiver.name} ${receiver.surname}`.trim(),
            phoneNumber: receiver.phoneNumber || '',
            email: receiver.email,
            isPrimary: false,
        });

        await contactRepository.updateInviteStatus(inviteId, 'accepted');
        return ok(undefined);
    }
}

export const contactService = new ContactService();
