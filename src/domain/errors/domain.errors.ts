// =============================================================================
// Blink Engine - Domain Errors
// =============================================================================
// Typed domain errors for explicit failure handling

/**
 * Base domain error with code and retryability
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    abstract readonly retryable: boolean;
    readonly details?: Record<string, unknown>;

    constructor(message: string, details?: Record<string, unknown>) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            retryable: this.retryable,
        };
    }
}

// =============================================================================
// Authentication Errors
// =============================================================================

export class InvalidCredentialsError extends DomainError {
    readonly code = 'AUTH_INVALID_CREDENTIALS';
    readonly statusCode = 401;
    readonly retryable = false;

    constructor() {
        super('Invalid email or password');
    }
}

export class TokenExpiredError extends DomainError {
    readonly code = 'AUTH_TOKEN_EXPIRED';
    readonly statusCode = 401;
    readonly retryable = true;

    constructor() {
        super('Token has expired');
    }
}

export class TokenInvalidError extends DomainError {
    readonly code = 'AUTH_TOKEN_INVALID';
    readonly statusCode = 401;
    readonly retryable = false;

    constructor() {
        super('Token is invalid');
    }
}

export class RefreshTokenRevokedError extends DomainError {
    readonly code = 'AUTH_REFRESH_TOKEN_REVOKED';
    readonly statusCode = 401;
    readonly retryable = false;

    constructor() {
        super('Refresh token has been revoked. Please log in again.');
    }
}

export class UnauthorizedError extends DomainError {
    readonly code = 'AUTH_UNAUTHORIZED';
    readonly statusCode = 401;
    readonly retryable = false;

    constructor(message = 'Authentication required') {
        super(message);
    }
}

// =============================================================================
// Validation Errors
// =============================================================================

export class ValidationError extends DomainError {
    readonly code = 'VALIDATION_ERROR';
    readonly statusCode = 400;
    readonly retryable = false;

    constructor(message: string, details?: Record<string, unknown>) {
        super(message, details);
    }
}

// =============================================================================
// Resource Errors
// =============================================================================

export class NotFoundError extends DomainError {
    readonly code = 'RESOURCE_NOT_FOUND';
    readonly statusCode = 404;
    readonly retryable = false;

    constructor(resource: string, id?: string) {
        super(id ? `${resource} with id '${id}' not found` : `${resource} not found`);
    }
}

export class ConflictError extends DomainError {
    readonly code = 'RESOURCE_CONFLICT';
    readonly statusCode = 409;
    readonly retryable = false;

    constructor(message: string) {
        super(message);
    }
}

export class EmailAlreadyExistsError extends ConflictError {
    constructor() {
        super('An account with this email already exists');
    }
}

// =============================================================================
// Rate Limiting Errors
// =============================================================================

export class RateLimitExceededError extends DomainError {
    readonly code = 'RATE_LIMIT_EXCEEDED';
    readonly statusCode = 429;
    readonly retryable = true;
    readonly retryAfter: number;

    constructor(retryAfter: number) {
        super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
        this.retryAfter = retryAfter;
    }
}

// =============================================================================
// Safety-Critical Errors
// =============================================================================

export class SosAlreadyActiveError extends DomainError {
    readonly code = 'SOS_ALREADY_ACTIVE';
    readonly statusCode = 409;
    readonly retryable = false;

    constructor() {
        super('An SOS event is already active');
    }
}

export class SosNotActiveError extends DomainError {
    readonly code = 'SOS_NOT_ACTIVE';
    readonly statusCode = 400;
    readonly retryable = false;

    constructor() {
        super('No active SOS event to cancel');
    }
}

// =============================================================================
// Internal Errors
// =============================================================================

export class InternalError extends DomainError {
    readonly code = 'INTERNAL_ERROR';
    readonly statusCode = 500;
    readonly retryable = true;

    constructor(message = 'An unexpected error occurred') {
        super(message);
    }
}

export class DatabaseError extends DomainError {
    readonly code = 'DATABASE_ERROR';
    readonly statusCode = 500;
    readonly retryable = true;

    constructor(message = 'Database operation failed') {
        super(message);
    }
}

// =============================================================================
// Type Guards
// =============================================================================

export const isDomainError = (error: unknown): error is DomainError => {
    return error instanceof DomainError;
};
