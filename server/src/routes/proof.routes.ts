import { Router } from 'express';
import { createProof, voteOnProof } from '../controllers/credibility.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createProofSchema, voteProofSchema } from '../schemas/credibility.schema';

const router = Router();

router.post('/', authenticate, validate(createProofSchema), createProof);
router.post('/:id/vote', authenticate, validate(voteProofSchema), voteOnProof);

export default router;
