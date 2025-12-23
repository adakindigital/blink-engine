// =============================================================================
// Blink Engine - User Service
// =============================================================================
// User profile business logic

import { Result, ok, fail } from '../utils/result.js';
import { NotFoundError, DomainError } from '../domain/errors/domain.errors.js';
import { userRepository, UserWithoutPassword } from '../repositories/user.repository.js';
import { uploadService } from './upload.service.js';

// =============================================================================
// Types
// =============================================================================

interface UpdateProfileInput {
    name?: string;
    surname?: string;
    phoneNumber?: string;
    isTracking?: boolean;
}

interface UploadImageResult {
    profileImageUrl: string;
}

// =============================================================================
// Service
// =============================================================================

class UserService {
    /**
     * Get user profile
     */
    async getProfile(userId: string): Promise<Result<UserWithoutPassword, DomainError>> {
        const user = await userRepository.findById(userId);
        if (!user) {
            return fail(new NotFoundError('User'));
        }
        return ok(user);
    }

    /**
     * Update user profile
     */
    async updateProfile(
        userId: string,
        input: UpdateProfileInput
    ): Promise<Result<UserWithoutPassword, DomainError>> {
        const user = await userRepository.findById(userId);
        if (!user) {
            return fail(new NotFoundError('User'));
        }

        const updatedUser = await userRepository.update(userId, input);
        return ok(updatedUser);
    }

    /**
     * Upload profile image
     */
    async uploadProfileImage(
        userId: string,
        fileBuffer: Buffer,
        mimeType: string,
        originalName: string
    ): Promise<Result<UploadImageResult, DomainError>> {
        const user = await userRepository.findById(userId);
        if (!user) {
            return fail(new NotFoundError('User'));
        }

        // Delete old image if exists
        if (user.profileImageUrl) {
            await uploadService.deleteProfileImage(user.profileImageUrl);
        }

        // Upload new image
        const uploadResult = await uploadService.uploadProfileImage(
            userId,
            fileBuffer,
            mimeType,
            originalName
        );

        if (!uploadResult.success) {
            return fail(uploadResult.error);
        }

        // Update user with new image URL
        await userRepository.update(userId, {
            profileImageUrl: uploadResult.data.url,
        });

        return ok({ profileImageUrl: uploadResult.data.url });
    }
}

export const userService = new UserService();

