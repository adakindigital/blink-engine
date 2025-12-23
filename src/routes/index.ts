// =============================================================================
// Blink Engine - Route Index
// =============================================================================
// Central route registration

import { Router } from 'express';
import { authRoutes } from './v1/auth.routes.js';
import { userRoutes } from './v1/user.routes.js';
import { contactRoutes } from './v1/contact.routes.js';
import { locationRoutes } from './v1/location.routes.js';
import { sosRoutes } from './v1/sos.routes.js';
import { mapsRoutes } from './v1/maps.routes.js';

const router = Router();

// API v1 routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/contacts', contactRoutes);
router.use('/v1/locations', locationRoutes);
router.use('/v1/sos', sosRoutes);
router.use('/v1/maps', mapsRoutes);

export { router as apiRoutes };
