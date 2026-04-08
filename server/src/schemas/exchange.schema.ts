import { z } from 'zod';

export const createExchangeSchema = z.object({
    requesterId: z
        .string()
        .uuid('Invalid requester ID format'),
    serviceId: z
        .string()
        .uuid('Invalid service ID format')
        .optional(),
    hours: z
        .number()
        .positive('Hours must be positive')
        .max(100, 'Hours cannot exceed 100'),
});

export const exchangeQuerySchema = z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'ACTIVE', 'COMPLETED']).optional(),
    limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
    offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export type CreateExchangeInput = z.infer<typeof createExchangeSchema>;
