// =============================================================================
// Blink Engine - User Service
// =============================================================================
// User profile business logic

import { Result, ok, fail } from '../utils/result.js';
import { NotFoundError, DomainError } from '../domain/errors/domain.errors.js';
import { userRepository, UserWithoutPassword } from '../repositories/user.repository.js';

// =============================================================================
// Types
// =============================================================================

interface UpdateProfileInput {
    name?: string;
    surname?: string;
    phoneNumber?: string;
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
}

export const userService = new UserService();
