import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler.middleware';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));

                next(new AppError('Validation failed', 400, errors));
                return;
            }

            next(error);
        }
    };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));

                next(new AppError('Invalid query parameters', 400, errors));
                return;
            }

            next(error);
        }
    };
}

/**
 * Validate URL parameters
 */
export function validateParams(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));

                next(new AppError('Invalid URL parameters', 400, errors));
                return;
            }

            next(error);
        }
    };
}
