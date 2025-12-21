// =============================================================================
// Blink Engine - Express Type Extensions
// =============================================================================
// TypeScript type augmentations for Express

import { JwtPayload } from '../middleware/auth.middleware.js';

declare global {
    namespace Express {
        interface Request {
            /**
             * Correlation ID for request tracing
             */
            correlationId: string;

            /**
             * Authenticated user ID (from JWT)
             */
            userId?: string;

            /**
             * Authenticated user email (from JWT)
             */
            userEmail?: string;
        }
    }
}

export { };
