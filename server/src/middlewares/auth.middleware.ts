import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Authentication middleware
 * Extracts JWT from Authorization header and verifies it
 * Attaches user info to req.user if valid
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: 'Authorization header is required',
            });
            return;
        }

        // Check Bearer token format
        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Invalid authorization format. Use: Bearer <token>',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token is required',
            });
            return;
        }

        // Verify token and attach user to request
        const payload = verifyToken(token);
        req.user = payload;

        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof Error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Token has expired',
                });
                return;
            }

            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                });
                return;
            }
        }

        res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
}

/**
 * Optional authentication middleware
 * Same as authenticate but doesn't fail if no token provided
 */
export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.substring(7);

    if (!token) {
        next();
        return;
    }

    try {
        const payload = verifyToken(token);
        req.user = payload;
    } catch {
        // Token invalid, but continue without auth
    }

    next();
}
