// =============================================================================
// Blink Engine - User Routes
// =============================================================================
// User profile endpoints

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import * as userController from '../../controllers/user.controller.js';
import { updateProfileSchema } from '../../controllers/user.controller.js';

const router = Router();

// Multer configuration for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validateBody(updateProfileSchema), userController.updateProfile);
router.post('/profile/image', upload.single('image'), userController.uploadProfileImage);

export { router as userRoutes };

