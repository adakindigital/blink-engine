// =============================================================================
// Blink Engine - User Routes
// =============================================================================
// User profile endpoints

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import * as userController from '../../controllers/user.controller.js';
import { updateProfileSchema } from '../../controllers/user.controller.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validateBody(updateProfileSchema), userController.updateProfile);

export { router as userRoutes };
