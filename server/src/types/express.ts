// Type augmentation for Express Request
// Using module augmentation instead of ambient declaration

import { TokenPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
    interface Request {
        user?: TokenPayload;
    }
}
