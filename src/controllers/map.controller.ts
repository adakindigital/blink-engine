import { Request, Response, NextFunction } from 'express';
import { contactRepository } from '../repositories/contact.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { locationService } from '../services/location.service.js';
import { sosService } from '../services/sos.service.js';

export class MapController {
    /**
     * GET /api/v1/maps/contacts
     * Retrieve contacts with their latest location (if allowed)
     */
    static async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;

            // 1. Fetch all contacts for the user
            const contacts = await contactRepository.findAllByUserId(userId);

            const results = [];

            for (const contact of contacts) {
                // We only care about contacts that are linked to a real user
                if (!contact.contactUserId) continue;

                // 2. Fetch the contact's user profile to check isTracking
                const contactUser = await userRepository.findById(contact.contactUserId);

                if (!contactUser) continue;

                let locationData = null;

                // 3. Privacy Check: Only fetch location if contact has tracking enabled
                if (contactUser.isTracking) {
                    const locResult = await locationService.getLatestLocation(contactUser.id);
                    if (locResult.success && locResult.data) {
                        locationData = {
                            lat: locResult.data.latitude,
                            lng: locResult.data.longitude,
                            lastSeen: locResult.data.timestamp,
                        };
                    }
                }

                // 4. Check if contact has an active SOS
                const sosResult = await sosService.getActiveSos(contactUser.id);
                const activeSos = sosResult.success ? sosResult.data : null;

                // 5. Construct response object (always return contact info, conditionally location)
                results.push({
                    id: contactUser.id,
                    name: `${contactUser.name} ${contactUser.surname}`,
                    avatarUrl: contactUser.profileImageUrl || `https://ui-avatars.com/api/?name=${contactUser.name}+${contactUser.surname}`,
                    isTracking: contactUser.isTracking,
                    location: locationData,
                    // SOS status from actual SOS service
                    isSOSActive: activeSos !== null,
                    sosTimestamp: activeSos?.triggeredAt ?? null,
                });
            }

            res.json({ data: results });
        } catch (error) {
            next(error);
        }
    }
}

