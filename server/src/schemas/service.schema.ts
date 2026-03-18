import { z } from 'zod';

export const createServiceSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be at most 200 characters')
        .trim(),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be at most 2000 characters')
        .trim(),
    category: z
        .string()
        .min(1, 'Category is required')
        .max(100, 'Category must be at most 100 characters')
        .trim(),
    occupationId: z
        .string()
        .uuid('Invalid occupation ID')
        .nullable()
        .optional(),
});

export const updateServiceSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be at most 200 characters')
        .trim()
        .optional(),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description must be at most 2000 characters')
        .trim()
        .optional(),
    category: z
        .string()
        .min(1, 'Category is required')
        .max(100, 'Category must be at most 100 characters')
        .trim()
        .optional(),
    isActive: z
        .boolean()
        .optional(),
    occupationId: z
        .string()
        .uuid('Invalid occupation ID')
        .nullable()
        .optional(),
});

export const serviceQuerySchema = z.object({
    category: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
    limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
    offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
