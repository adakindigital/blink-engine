import { Router } from 'express';
import { SecurityNodeController } from '../../controllers/security-node.controller.js';
import { MapController } from '../../controllers/map.controller.js';
// import { authenticate } from '../../middleware/auth.middleware.js'; // Assuming auth middleware exists

const router = Router();

// Retrieve nearby security nodes
// GET /api/v1/maps/security-nodes?lat=...&lng=...
router.get('/security-nodes', SecurityNodeController.getNearby);

// Retrieve contacts with location
// GET /api/v1/maps/contacts
router.get('/contacts', MapController.getContacts);

export const mapsRoutes = router;
