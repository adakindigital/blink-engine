import { Request, Response, NextFunction } from 'express';
import { securityNodeService } from '../services/security-node.service.js';
import { z } from 'zod';

export class SecurityNodeController {
    static async getNearby(req: Request, res: Response, next: NextFunction) {
        try {
            const schema = z.object({
                lat: z.coerce.number(),
                lng: z.coerce.number()
            });

            const { lat, lng } = schema.parse(req.query);
            const result = await securityNodeService.getNearbyNodes(lat, lng);

            if (result.success) {
                res.json({ data: result.data });
            } else {
                next(result.error);
            }
        } catch (error) {
            next(error);
        }
    }
}
