// =============================================================================
// Blink Engine - Contact Routes
// =============================================================================
// Emergency contact management endpoints

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validation.middleware.js';
import * as contactController from '../../controllers/contact.controller.js';
import { createContactSchema, updateContactSchema, idParamSchema } from '../../controllers/contact.controller.js';

const router = Router();

// All contact routes require authentication
router.use(authenticate);

// Invite Code endpoints (short-lived codes for secure contact adding)
router.post('/invite-code', contactController.generateInviteCode);
router.post('/invite-code/refresh', contactController.refreshInviteCode);

// Contact Invite CRUD
router.post('/invite', contactController.createInvite);
router.get('/invites', contactController.getIncomingInvites);
router.get('/invites/:id', validateParams(idParamSchema), contactController.getInvite);
router.post('/invites/:id/respond', validateParams(idParamSchema), contactController.respondToInvite);


router.get('/', contactController.listContacts);
router.post('/', validateBody(createContactSchema), contactController.createContact);
router.get('/:id', validateParams(idParamSchema), contactController.getContact);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateContactSchema), contactController.updateContact);
router.delete('/:id', validateParams(idParamSchema), contactController.deleteContact);

// Batch operations
router.post('/:id/set-primary', validateParams(idParamSchema), contactController.setPrimaryContact);

export { router as contactRoutes };
