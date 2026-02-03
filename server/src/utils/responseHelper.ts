import { Response } from 'express';

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: unknown[];
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

/**
 * Send a success response with data
 */
export function successResponse<T>(
    res: Response,
    data: T,
    message?: string,
    status = 200
): Response {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
}

/**
 * Send a created response (201) with data
 */
export function createdResponse<T>(
    res: Response,
    data: T,
    message = 'Created successfully'
): Response {
    return successResponse(res, data, message, 201);
}

/**
 * Send a success response without data
 */
export function successMessageResponse(
    res: Response,
    message: string,
    status = 200
): Response {
    return res.status(status).json({
        success: true,
        message,
    });
}

/**
 * Send a paginated response
 */
export function paginatedResponse<T>(
    res: Response,
    items: T[],
    total: number,
    limit: number,
    offset: number
): Response {
    return res.json({
        success: true,
        data: {
            items,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + items.length < total,
            },
        },
    });
}

/**
 * Send an error response
 */
export function errorResponse(
    res: Response,
    message: string,
    status = 400,
    errors?: unknown[]
): Response {
    const response: ApiResponse = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(status).json(response);
}

/**
 * Send a not found response
 */
export function notFoundResponse(res: Response, resource = 'Resource'): Response {
    return errorResponse(res, `${resource} not found`, 404);
}

/**
 * Send an unauthorized response
 */
export function unauthorizedResponse(res: Response, message = 'Unauthorized'): Response {
    return errorResponse(res, message, 401);
}

/**
 * Send a forbidden response
 */
export function forbiddenResponse(res: Response, message = 'Forbidden'): Response {
    return errorResponse(res, message, 403);
}

/**
 * Send a validation error response
 */
export function validationErrorResponse(res: Response, errors: unknown[]): Response {
    return errorResponse(res, 'Validation failed', 400, errors);
}
