// =============================================================================
// Blink Engine - Contact Controller
// =============================================================================
// Emergency contact HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contactService } from '../services/contact.service.js';
import { logger } from '../utils/logger.js';

// =============================================================================
// Request Schemas
// =============================================================================

export const idParamSchema = z.object({
    id: z.string().cuid('Invalid ID format'),
});

export const createContactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    email: z.string().email().optional(),
    isPrimary: z.boolean().optional().default(false),
});

export const updateContactSchema = z.object({
    name: z.string().min(1).optional(),
    phoneNumber: z.string().min(1).optional(),
    email: z.string().email().optional(),
});

// =============================================================================
// Request Types
// =============================================================================

export type IdParam = z.infer<typeof idParamSchema>;
export type CreateContactRequest = z.infer<typeof createContactSchema>;
export type UpdateContactRequest = z.infer<typeof updateContactSchema>;

// =============================================================================
// Handlers
// =============================================================================

/**
 * GET /v1/contacts
 * List all contacts for the current user
 */
export const listContacts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await contactService.listContacts(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/contacts
 * Create a new emergency contact
 */
export const createContact = async (
    req: Request<unknown, unknown, CreateContactRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await contactService.createContact(userId, req.body);

        if (!result.success) {
            throw result.error;
        }

        logger.info('Contact created', {
            correlationId: req.correlationId,
            userId,
            contactId: result.data.id,
        });

        res.status(201).json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/contacts/:id
 * Get a specific contact
 */
export const getContact = async (
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await contactService.getContact(userId, id);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /v1/contacts/:id
 * Update a contact
 */
export const updateContact = async (
    req: Request<IdParam, unknown, UpdateContactRequest>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await contactService.updateContact(userId, id, req.body);

        if (!result.success) {
            throw result.error;
        }

        logger.info('Contact updated', {
            correlationId: req.correlationId,
            userId,
            contactId: id,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /v1/contacts/:id
 * Delete a contact
 */
export const deleteContact = async (
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await contactService.deleteContact(userId, id);

        if (!result.success) {
            throw result.error;
        }

        logger.info('Contact deleted', {
            correlationId: req.correlationId,
            userId,
            contactId: id,
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/contacts/:id/set-primary
 * Set a contact as primary
 */
export const setPrimaryContact = async (
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await contactService.setPrimaryContact(userId, id);

        if (!result.success) {
            throw result.error;
        }

        logger.info('Primary contact set', {
            correlationId: req.correlationId,
            userId,
            contactId: id,
        });

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

// =============================================================================
// Invite Endpoints
// =============================================================================

/**
 * POST /v1/contacts/invite
 * Invite a user by ID
 */
export const createInvite = async (
    req: Request<unknown, unknown, { receiverId: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { receiverId } = req.body;

        if (!receiverId) {
            throw new Error('Receiver ID is required');
        }

        const result = await contactService.createInvite(userId, receiverId);

        if (!result.success) {
            throw result.error;
        }

        res.status(201).json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/contacts/invites
 * Get incoming invites
 */
export const getIncomingInvites = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const result = await contactService.getIncomingInvites(userId);

        if (!result.success) {
            throw result.error;
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /v1/contacts/invites/:id/respond
 * Accept or decline an invite
 */
export const respondToInvite = async (
    req: Request<IdParam, unknown, { accept: boolean }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { accept } = req.body;

        const result = await contactService.respondToInvite(userId, id, accept);

        if (!result.success) {
            throw result.error;
        }

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /v1/contacts/invites/:id
 * Get invite status
 */
export const getInvite = async (
    req: Request<IdParam>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const result = await contactService.getInvite(id);

        if (!result.success) {
            throw result.error;
        }

        // Ownership check - allow sender or receiver
        if (result.data.senderId !== userId && result.data.receiverId !== userId) {
            // Throwing generic error for now, ideally DomainError
            throw new Error('Unauthorized access to invite');
        }

        res.json({ data: result.data });
    } catch (error) {
        next(error);
    }
};
