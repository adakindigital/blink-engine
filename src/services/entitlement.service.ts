import { Result, ok } from '../utils/result.js';
import { DomainError } from '../domain/errors/domain.errors.js';
import { userRepository } from '../repositories/user.repository.js';

export enum Entitlement {
    SECURITY_NETWORK = 'SECURITY_NETWORK',
    PRO_MAP_FILTERS = 'PRO_MAP_FILTERS'
}

class EntitlementService {
    /**
     * Check if user has access to a feature
     */
    async checkEntitlement(userId: string, _entitlement: Entitlement): Promise<Result<boolean, DomainError>> {
        const user = await userRepository.findById(userId);
        if (!user) return ok(false);

        // Simple check for now: Is Premium?
        // In future: Check specific plan capabilities
        if (user.isPremium) return ok(true);

        return ok(false);
    }
}

export const entitlementService = new EntitlementService();
