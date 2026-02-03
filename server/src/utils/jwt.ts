import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config';

export interface TokenPayload {
    userId: string;
    email: string;
}

/**
 * Sign a JWT token with user payload
 */
export function signToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Verify and decode a JWT token
 * Throws an error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & TokenPayload;

    return {
        userId: decoded.userId,
        email: decoded.email,
    };
}

/**
 * Decode a token without verification (useful for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
    const decoded = jwt.decode(token) as (JwtPayload & TokenPayload) | null;

    if (!decoded) {
        return null;
    }

    return {
        userId: decoded.userId,
        email: decoded.email,
    };
}
