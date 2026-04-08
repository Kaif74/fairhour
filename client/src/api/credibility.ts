import { api } from './index';
import {
  ApiCredibilityProof,
  ApiOccupationCredibilitySummary,
  ApiProofVoteSummary,
  ApiUserOccupationCredibility,
} from '../types';

export async function getUserOccupationCredibility(
  userId: string,
  occupationId: string
): Promise<ApiUserOccupationCredibility | null> {
  try {
    const response = await api.get<ApiUserOccupationCredibility>(
      `/api/users/${userId}/experience/${occupationId}`,
      { auth: false }
    );

    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.error('Failed to fetch occupation credibility:', error);
    return null;
  }
}

export async function getUserCredibility(
  userId: string
): Promise<ApiOccupationCredibilitySummary[]> {
  try {
    const response = await api.get<{ userId: string; skills: ApiOccupationCredibilitySummary[] }>(
      `/api/users/${userId}/credibility`,
      { auth: false }
    );

    return response.success && response.data ? response.data.skills : [];
  } catch (error) {
    console.error('Failed to fetch user credibility:', error);
    return [];
  }
}

export async function uploadProof(data: {
  occupationId: string;
  proofType: 'certificate' | 'portfolio' | 'link' | 'image';
  proofUrl: string;
  description?: string;
  declaredLevel?: 'beginner' | 'intermediate' | 'expert';
}): Promise<ApiCredibilityProof | null> {
  try {
    const response = await api.post<ApiCredibilityProof>('/api/proofs', data);
    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.error('Failed to upload proof:', error);
    throw error;
  }
}

export async function voteOnProof(
  proofId: string,
  voteType: 'valid' | 'irrelevant' | 'fake'
): Promise<ApiProofVoteSummary | null> {
  try {
    const response = await api.post<{ votes: ApiProofVoteSummary }>(
      `/api/proofs/${proofId}/vote`,
      { voteType }
    );

    return response.success && response.data ? response.data.votes : null;
  } catch (error) {
    console.error('Failed to vote on proof:', error);
    throw error;
  }
}

export async function updateDeclaredExperience(
  occupationId: string,
  declaredLevel: 'beginner' | 'intermediate' | 'expert'
): Promise<ApiUserOccupationCredibility | null> {
  try {
    const response = await api.put<ApiUserOccupationCredibility>(
      `/api/users/me/experience/${occupationId}`,
      { declaredLevel }
    );

    return response.success && response.data ? response.data : null;
  } catch (error) {
    console.error('Failed to update declared experience:', error);
    throw error;
  }
}
