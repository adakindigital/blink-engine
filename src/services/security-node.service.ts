import { SecurityNode } from '@prisma/client';
import { Result, ok } from '../utils/result.js';
import { DomainError } from '../domain/errors/domain.errors.js';

// Mock Data
const MOCK_NODES: Partial<SecurityNode>[] = [
    {
        id: 'sec_1',
        name: 'Officer Davis',
        company: 'SecureCorp',
        latitude: 51.5180,
        longitude: -0.1260,
        status: 'patrolling',
        eta: '2 min',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'sec_2',
        name: 'Unit 404',
        company: 'CityGuard',
        latitude: 51.5150,
        longitude: -0.1240,
        status: 'active',
        eta: '1 min',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

class SecurityNodeService {
    async getNearbyNodes(_lat: number, _lng: number): Promise<Result<Partial<SecurityNode>[], DomainError>> {
        // In a real app, use PostGIS or Haversine to filter by radius.
        // For now, return all mocks.
        return ok(MOCK_NODES);
    }
}

export const securityNodeService = new SecurityNodeService();
