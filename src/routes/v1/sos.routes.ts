// =============================================================================
// Blink Engine - SOS Routes
// =============================================================================
// Safety-critical SOS endpoints

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { sosRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import * as sosController from '../../controllers/sos.controller.js';
import { triggerSosSchema, cancelSosSchema } from '../../controllers/sos.controller.js';

const router = Router();

// All SOS routes require authentication and have specific rate limiting
router.use(authenticate);
router.use(sosRateLimiter);

// SOS actions
router.post('/trigger', validateBody(triggerSosSchema), sosController.triggerSos);
router.post('/cancel', validateBody(cancelSosSchema), sosController.cancelSos);
router.post('/resolve', sosController.resolveSos);

// SOS status
router.get('/active', sosController.getActiveSos);
router.get('/history', sosController.getSosHistory);

export { router as sosRoutes };
