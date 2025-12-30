import { generateRandomCode } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

// In-memory store for OTPs (identifier -> { code, expiresAt })
// For production, this should be replaced with Redis
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

const OTP_TTL_MINUTES = 10;

export class OtpService {
    /**
     * Generate and send an OTP to the given identifier (email or phone)
     * @param identifier Email or phone number
     * @param type 'email' or 'sms'
     */
    async sendOtp(identifier: string, type: 'email' | 'sms'): Promise<{ success: boolean; message: string }> {
        const code = generateRandomCode(6);
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        otpStore.set(identifier, { code, expiresAt });

        // In a real application, we would use an Email or SMS provider here.
        // For this MVP/Development, we log the OTP to the console.
        logger.info(`[OTP SERVICE] Generated OTP for ${identifier} (${type}): ${code}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, message: `OTP sent to ${identifier}` };
    }

    /**
     * Verify the OTP for a given identifier
     * @param identifier Email or phone number
     * @param code The code entered by the user
     */
    async verifyOtp(identifier: string, code: string): Promise<{ success: boolean; message?: string }> {
        const record = otpStore.get(identifier);

        if (!record) {
            return { success: false, message: 'OTP not found or expired' };
        }

        if (new Date() > record.expiresAt) {
            otpStore.delete(identifier);
            return { success: false, message: 'OTP expired' };
        }

        if (record.code !== code) {
            return { success: false, message: 'Invalid OTP' };
        }

        // OTP is valid, clear it
        otpStore.delete(identifier);
        return { success: true };
    }
}

export const otpService = new OtpService();
