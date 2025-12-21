// =============================================================================
// Blink Engine - Result Type
// =============================================================================
// Explicit success/failure handling for all service methods

/**
 * Success result variant
 */
export interface Success<T> {
    success: true;
    data: T;
}

/**
 * Failure result variant
 */
export interface Failure<E> {
    success: false;
    error: E;
}

/**
 * Result type for explicit error handling
 * All service methods should return this type
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Create a success result
 */
export const ok = <T>(data: T): Success<T> => ({
    success: true,
    data,
});

/**
 * Create a failure result
 */
export const fail = <E>(error: E): Failure<E> => ({
    success: false,
    error,
});

/**
 * Type guard for success result
 */
export const isOk = <T, E>(result: Result<T, E>): result is Success<T> => {
    return result.success === true;
};

/**
 * Type guard for failure result
 */
export const isFail = <T, E>(result: Result<T, E>): result is Failure<E> => {
    return result.success === false;
};

/**
 * Unwrap a result or throw the error
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
    if (result.success) {
        return result.data;
    }
    throw result.error;
};

/**
 * Unwrap a result or return a default value
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (result.success) {
        return result.data;
    }
    return defaultValue;
};

/**
 * Map a success result to a new value
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.success) {
        return ok(fn(result.data));
    }
    return result;
};

/**
 * Map a failure result to a new error
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (!result.success) {
        return fail(fn(result.error));
    }
    return result;
};

/**
 * Chain results together (flatMap)
 */
export const andThen = <T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>
): Result<U, E> => {
    if (result.success) {
        return fn(result.data);
    }
    return result;
};

/**
 * Execute a function and wrap the result
 */
export const tryCatch = <T>(fn: () => T): Result<T, Error> => {
    try {
        return ok(fn());
    } catch (error) {
        return fail(error instanceof Error ? error : new Error(String(error)));
    }
};

/**
 * Execute an async function and wrap the result
 */
export const tryCatchAsync = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
    try {
        return ok(await fn());
    } catch (error) {
        return fail(error instanceof Error ? error : new Error(String(error)));
    }
};
