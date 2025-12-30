import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { otpService } from '../services/OtpService.js';
import { logger } from '../utils/logger.js';

// Schemas
export const sendOtpSchema = z.object({
    identifier: z.string().min(1, 'Email or Phone is required'),
    type: z.enum(['email', 'sms']),
});

export const verifyOtpSchema = z.object({
    identifier: z.string().min(1, 'Email or Phone is required'),
    code: z.string().length(6, 'Code must be 6 digits'),
});

// Handlers
export const sendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { identifier, type } = sendOtpSchema.parse(req.body);

        const result = await otpService.sendOtp(identifier, type);

        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { identifier, code } = verifyOtpSchema.parse(req.body);

        const result = await otpService.verifyOtp(identifier, code);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message,
            });
            return;
        }

        res.json({
            success: true,
            message: 'OTP verified successfully',
        });
    } catch (error) {
        next(error);
    }
};
