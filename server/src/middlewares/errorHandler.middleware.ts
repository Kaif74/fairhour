import { Request, Response, NextFunction } from 'express';
import config from '../config';

interface ApiError extends Error {
    statusCode?: number;
    errors?: unknown[];
}

/**
 * Centralized error handler middleware
 * Handles all errors and returns consistent response format
 */
export function errorHandler(
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error in development
    if (config.isDevelopment) {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode,
        });
    }

    // Don't leak stack traces in production
    const response: {
        success: boolean;
        message: string;
        errors?: unknown[];
        stack?: string;
    } = {
        success: false,
        message,
    };

    // Include validation errors if present
    if (err.errors) {
        response.errors = err.errors;
    }

    // Include stack trace only in development
    if (config.isDevelopment && err.stack) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * Not Found handler for undefined routes
 */
export function notFoundHandler(
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
}

/**
 * Create a custom API error
 */
export class AppError extends Error {
    statusCode: number;
    errors?: unknown[];

    constructor(message: string, statusCode: number, errors?: unknown[]) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'AppError';

        Error.captureStackTrace(this, this.constructor);
    }
}
