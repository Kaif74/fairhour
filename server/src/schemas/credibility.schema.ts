import { z } from 'zod';

export const createProofSchema = z.object({
  occupationId: z.string().uuid('Occupation ID must be a valid UUID'),
  proofType: z.enum(['certificate', 'portfolio', 'link', 'image'], {
    errorMap: () => ({
      message: 'Proof type must be one of: certificate, portfolio, link, image',
    }),
  }),
  proofUrl: z.string().url('Proof URL must be a valid URL'),
  description: z.string().trim().max(500).optional(),
  declaredLevel: z
    .enum(['beginner', 'intermediate', 'expert'], {
      errorMap: () => ({
        message: 'Declared level must be beginner, intermediate, or expert',
      }),
    })
    .optional(),
});

export const voteProofSchema = z.object({
  voteType: z.enum(['valid', 'irrelevant', 'fake'], {
    errorMap: () => ({
      message: 'Vote type must be one of: valid, irrelevant, fake',
    }),
  }),
});

export const updateDeclaredExperienceSchema = z.object({
  declaredLevel: z.enum(['beginner', 'intermediate', 'expert'], {
    errorMap: () => ({
      message: 'Declared level must be beginner, intermediate, or expert',
    }),
  }),
});

export type CreateProofInput = z.infer<typeof createProofSchema>;
export type VoteProofInput = z.infer<typeof voteProofSchema>;
export type UpdateDeclaredExperienceInput = z.infer<typeof updateDeclaredExperienceSchema>;
