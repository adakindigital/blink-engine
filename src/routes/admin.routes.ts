
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

// Create Security Personnel
router.post('/security-personnel', AdminController.createSecurityPersonnel);

export const adminRoutes = router;
