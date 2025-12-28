import { Router } from 'express';
import { WaitlistController } from '../../controllers/waitlist.controller.js';

const router = Router();

/**
 * @route   POST /api/v1/waitlist
 * @desc    Signup or update waitlist entry
 * @access  Public
 */
router.post('/', WaitlistController.signup);

/**
 * @route   GET /api/v1/waitlist/:email
 * @desc    Get waitlist entry status
 * @access  Public
 */
router.get('/:email', WaitlistController.getStatus);

export { router as waitlistRoutes };
