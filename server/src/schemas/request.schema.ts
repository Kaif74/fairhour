import { z } from 'zod';

export const createRequestSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must be at most 100 characters')
        .trim(),
    serviceCategory: z
        .string()
        .min(1, 'Service category is required')
        .max(100, 'Category must be at most 100 characters')
        .trim(),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be at most 2000 characters')
        .trim(),
    hours: z
        .number()
        .min(0.5, 'Minimum request is 0.5 hours')
        .max(20, 'Maximum request is 20 hours')
        .default(1),
});

export const updateRequestStatusSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
        errorMap: () => ({ message: 'Status must be one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED' }),
    }),
});

export const requestQuerySchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    serviceCategory: z.string().optional(),
    limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
    offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
