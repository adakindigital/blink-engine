
import { Router } from 'express';
import { securityService } from '../services/security.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';

const router = Router();

// Middleware to ensure user is security personnel
const requireSecurityPersonnel = async (req: any, res: any, next: any) => {
    const userId = req.userId;
    const personnel = await prisma.securityPersonnel.findUnique({ where: { userId } });

    if (!personnel) {
        return res.status(403).json({ error: 'Access denied. Not security personnel.' });
    }

    req.securityPersonnelId = personnel.id;
    next();
};

// Get nearby alerts
router.get('/alerts', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const result = await securityService.getNearbyAlerts(lat, lng);

    if (result.success) {
        return res.json(result.data);
    } else {
        return res.status(500).json({ error: result.error.message });
    }
});

// Claim alert
router.post('/alerts/:id/claim', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const alertId = req.params.id;
    const personnelId = req.securityPersonnelId;

    const result = await securityService.claimAlert(alertId, personnelId);

    if (result.success) {
        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: result.error.message });
    }
});

// Update status
router.post('/alerts/:id/status', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const alertId = req.params.id;
    const { status } = req.body;
    const personnelId = req.securityPersonnelId;

    if (!status) return res.status(400).json({ error: 'Status required' });

    const result = await securityService.updateDispatchStatus(alertId, status, personnelId);

    if (result.success) {
        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: result.error.message });
    }
});

// Update location
router.post('/location', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const { latitude, longitude } = req.body;
    const personnelId = req.securityPersonnelId;

    const result = await securityService.updateLocation(personnelId, { latitude, longitude });

    if (result.success) {
        return res.json({ success: true });
    } else {
        return res.status(500).json({ error: result.error.message });
    }
});

// Get mission history
router.get('/history', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const personnelId = req.securityPersonnelId;
    const result = await securityService.getMissionHistory(personnelId);

    if (result.success) {
        return res.json(result.data);
    } else {
        return res.status(500).json({ error: result.error.message });
    }
});

// Submit mission feedback
router.post('/alerts/:id/feedback', authenticate, requireSecurityPersonnel, async (req: any, res) => {
    const alertId = req.params.id;
    const personnelId = req.securityPersonnelId;
    const { rating, comment } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    const result = await securityService.submitFeedback(alertId, personnelId, rating, comment);

    if (result.success) {
        return res.json({ success: true });
    } else {
        return res.status(400).json({ error: result.error.message });
    }
});

export const securityRoutes = router;
