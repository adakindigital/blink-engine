// =============================================================================
// Blink Engine - Validation Middleware
// =============================================================================
// Zod schema validation at the API boundary

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation targets within a request
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Create a validation middleware for the specified target
 */
export const validate = <T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const data = req[target];
        const result = schema.safeParse(data);

        if (!result.success) {
            // Throw ZodError to be handled by error middleware
            throw result.error;
        }

        // Replace with parsed (and potentially transformed) data
        req[target] = result.data as typeof req[typeof target];

        next();
    };
};

/**
 * Validate request body
 */
export const validateBody = <T>(schema: ZodSchema<T>) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => validate(schema, 'query');

/**
 * Validate route parameters
 */
export const validateParams = <T>(schema: ZodSchema<T>) => validate(schema, 'params');

/**
 * Combine multiple validation middlewares
 */
export const validateRequest = <B, Q, P>(schemas: {
    body?: ZodSchema<B>;
    query?: ZodSchema<Q>;
    params?: ZodSchema<P>;
}) => {
    const middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] = [];

    if (schemas.body) {
        middlewares.push(validateBody(schemas.body));
    }
    if (schemas.query) {
        middlewares.push(validateQuery(schemas.query));
    }
    if (schemas.params) {
        middlewares.push(validateParams(schemas.params));
    }

    return (req: Request, res: Response, next: NextFunction): void => {
        let index = 0;

        const runNext: NextFunction = (err?: unknown): void => {
            if (err) {
                next(err);
                return;
            }

            if (index >= middlewares.length) {
                next();
                return;
            }

            const middleware = middlewares[index++];
            try {
                middleware(req, res, runNext);
            } catch (error) {
                next(error);
            }
        };

        runNext();
    };
};
