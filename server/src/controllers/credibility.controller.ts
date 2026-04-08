import {
  DeclaredExperienceLevel,
  ProofVoteType,
  SkillProofType,
} from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
  CreateProofInput,
  UpdateDeclaredExperienceInput,
  VoteProofInput,
} from '../schemas/credibility.schema';
import { credibilityService } from '../services/credibility.service';

function toDeclaredExperienceLevel(level: string): DeclaredExperienceLevel {
  switch (level) {
    case 'expert':
      return DeclaredExperienceLevel.EXPERT;
    case 'intermediate':
      return DeclaredExperienceLevel.INTERMEDIATE;
    case 'beginner':
    default:
      return DeclaredExperienceLevel.BEGINNER;
  }
}

function toSkillProofType(proofType: string): SkillProofType {
  switch (proofType) {
    case 'certificate':
      return SkillProofType.CERTIFICATE;
    case 'portfolio':
      return SkillProofType.PORTFOLIO;
    case 'image':
      return SkillProofType.IMAGE;
    case 'link':
    default:
      return SkillProofType.LINK;
  }
}

function toProofVoteType(voteType: string): ProofVoteType {
  switch (voteType) {
    case 'fake':
      return ProofVoteType.FAKE;
    case 'irrelevant':
      return ProofVoteType.IRRELEVANT;
    case 'valid':
    default:
      return ProofVoteType.VALID;
  }
}

export async function getUserSkillExperience(
  req: Request<{ id: string; occupationId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, occupationId } = req.params;
    const credibility = await credibilityService.getUserOccupationCredibility(id, occupationId);

    res.json({
      success: true,
      data: credibility,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserCredibility(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const skills = await credibilityService.getUserCredibilityOverview(id);

    res.json({
      success: true,
      data: {
        userId: id,
        skills,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyDeclaredExperience(
  req: Request<{ occupationId: string }, object, UpdateDeclaredExperienceInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { occupationId } = req.params;
    const declaredLevel = toDeclaredExperienceLevel(req.body.declaredLevel);

    await credibilityService.setDeclaredLevel(req.user.userId, occupationId, declaredLevel);

    const credibility = await credibilityService.getUserOccupationCredibility(req.user.userId, occupationId);

    res.json({
      success: true,
      message: 'Declared experience level updated successfully',
      data: credibility,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProof(
  req: Request<object, object, CreateProofInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const proof = await credibilityService.createProof({
      userId: req.user.userId,
      occupationId: req.body.occupationId,
      proofType: toSkillProofType(req.body.proofType),
      proofUrl: req.body.proofUrl,
      description: req.body.description,
      declaredLevel: req.body.declaredLevel
        ? toDeclaredExperienceLevel(req.body.declaredLevel)
        : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Proof added successfully',
      data: proof,
    });
  } catch (error) {
    next(error);
  }
}

export async function voteOnProof(
  req: Request<{ id: string }, object, VoteProofInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const proof = await credibilityService.voteOnProof({
      proofId: req.params.id,
      voterId: req.user.userId,
      voteType: toProofVoteType(req.body.voteType),
    });

    res.json({
      success: true,
      message: 'Proof vote recorded successfully',
      data: proof,
    });
  } catch (error) {
    next(error);
  }
}
