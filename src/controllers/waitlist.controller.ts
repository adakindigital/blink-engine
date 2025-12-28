import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Waitlist operations
 */
export class WaitlistController {
    /**
     * Upsert a waitlist entry
     * Allows multi-step collection (Email first, then Name/Suburb)
     */
    static async signup(req: Request, res: Response): Promise<void> {
        try {
            const { email, name, suburb, referredBy } = req.body;

            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }

            // 1. Upsert the current user's entry
            const updatedEntry = await prisma.waitlistEntry.upsert({
                where: { email },
                update: {
                    name: name || undefined,
                    suburb: suburb || undefined,
                },
                create: {
                    email,
                    name,
                    suburb,
                    referralCount: 0,
                },
            });

            // 2. If referred by someone else, increment THEIR count
            // This logic is triggered when the frontend sends `referredBy` 
            // (currently configured to only send when the form is "complete").
            if (referredBy && referredBy !== email) {
                try {
                    await prisma.waitlistEntry.update({
                        where: { email: referredBy },
                        data: {
                            referralCount: { increment: 1 }
                        }
                    });
                } catch (e) {
                    // Silently fail if referrer doesn't exist
                    console.warn(`Referrer ${referredBy} not found`);
                }
            }

            res.status(200).json({
                message: 'Waitlist updated successfully',
                data: updatedEntry,
            });
        } catch (error) {
            console.error('Waitlist Signup Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get waitlist entry status by email
     */
    static async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.params;

            const entry = await prisma.waitlistEntry.findUnique({
                where: { email },
            });

            if (!entry) {
                res.status(404).json({ error: 'Entry not found' });
                return;
            }

            res.status(200).json({ data: entry });
        } catch (error) {
            console.error('Waitlist Status Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
