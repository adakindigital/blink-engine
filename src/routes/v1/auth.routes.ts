// =============================================================================
// Blink Engine - Auth Routes
// =============================================================================
// Authentication endpoints

import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as authController from '../../controllers/auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from '../../controllers/auth.controller.js';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validateBody(refreshSchema), authController.refresh);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export { router as authRoutes };
