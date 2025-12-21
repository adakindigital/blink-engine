// =============================================================================
// Blink Engine - API Types
// =============================================================================
// Shared API type definitions

/**
 * Standard success response envelope
 */
export interface ApiSuccessResponse<T> {
    data: T;
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
    };
}

/**
 * Standard error response envelope
 */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        retryable: boolean;
    };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
    meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

/**
 * Common ID parameter
 */
export interface IdParam {
    id: string;
}
