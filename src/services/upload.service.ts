// =============================================================================
// Blink Engine - Upload Service
// =============================================================================
// File upload handling for profile images

import { Result, ok, fail } from '../utils/result.js';
import { DomainError, ValidationError } from '../domain/errors/domain.errors.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// =============================================================================
// Constants
// =============================================================================

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'profiles');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// =============================================================================
// Types
// =============================================================================

interface UploadResult {
    url: string;
    filename: string;
}

// =============================================================================
// Service
// =============================================================================

class UploadService {
    private initialized = false;

    /**
     * Ensure upload directory exists
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
            this.initialized = true;
            logger.info('Upload directory initialized', { path: UPLOAD_DIR });
        } catch (error) {
            logger.error('Failed to create upload directory', error);
            throw error;
        }
    }

    /**
     * Upload a profile image
     */
    async uploadProfileImage(
        userId: string,
        fileBuffer: Buffer,
        mimeType: string,
        _originalName: string
    ): Promise<Result<UploadResult, DomainError>> {
        await this.initialize();

        // Validate mime type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            return fail(new ValidationError(
                `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
            ));
        }

        // Validate file size
        if (fileBuffer.length > MAX_FILE_SIZE) {
            return fail(new ValidationError(
                `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            ));
        }

        // Generate unique filename
        const extension = this.getExtension(mimeType);
        const filename = `${userId}-${randomUUID()}${extension}`;
        const filePath = path.join(UPLOAD_DIR, filename);

        try {
            // Write file
            await fs.writeFile(filePath, fileBuffer);

            // Return URL path (relative to uploads endpoint)
            const url = `/uploads/profiles/${filename}`;

            logger.info('Profile image uploaded', {
                userId,
                filename,
                size: fileBuffer.length,
            });

            return ok({ url, filename });
        } catch (error) {
            logger.error('Failed to write profile image', { userId, error });
            return fail(new ValidationError('Failed to upload image'));
        }
    }

    /**
     * Delete a profile image
     */
    async deleteProfileImage(imageUrl: string): Promise<void> {
        if (!imageUrl) return;

        const filename = path.basename(imageUrl);
        const filePath = path.join(UPLOAD_DIR, filename);

        try {
            await fs.unlink(filePath);
            logger.info('Profile image deleted', { filename });
        } catch (error) {
            // File might not exist, log but don't throw
            logger.warn('Failed to delete profile image', { filename, error });
        }
    }

    private getExtension(mimeType: string): string {
        switch (mimeType) {
            case 'image/jpeg':
                return '.jpg';
            case 'image/png':
                return '.png';
            case 'image/webp':
                return '.webp';
            default:
                return '.jpg';
        }
    }
}

export const uploadService = new UploadService();
