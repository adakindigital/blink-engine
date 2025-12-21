// =============================================================================
// Blink Engine - Location Routes
// =============================================================================
// Location tracking endpoints

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import * as locationController from '../../controllers/location.controller.js';
import { recordLocationSchema, locationHistoryQuerySchema } from '../../controllers/location.controller.js';

const router = Router();

// All location routes require authentication
router.use(authenticate);

// Location recording
router.post('/', validateBody(recordLocationSchema), locationController.recordLocation);
router.post('/batch', validateBody(recordLocationSchema.array()), locationController.recordBatchLocations);

// Location history
router.get('/history', validateQuery(locationHistoryQuerySchema), locationController.getLocationHistory);
router.get('/latest', locationController.getLatestLocation);

export { router as locationRoutes };
