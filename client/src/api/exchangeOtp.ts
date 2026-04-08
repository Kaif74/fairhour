import { api } from './index';
import { ApiExchangeOtpStatus } from '../types';

interface OtpMutationResponse {
  revealedOtp: string | null;
  exchange: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED';
    startedAt: string | null;
    completedAt: string | null;
    providerConfirmed: boolean;
    requesterConfirmed: boolean;
    blockchainTxHash: string | null;
  };
  otpStatus: ApiExchangeOtpStatus;
}

export async function getExchangeOtpStatus(exchangeId: string): Promise<ApiExchangeOtpStatus> {
  const response = await api.get<ApiExchangeOtpStatus>(`/api/exchanges/${exchangeId}/otp/status`);
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to load OTP status');
  }

  return response.data;
}

async function postOtpMutation(
  exchangeId: string,
  path: string,
  body?: { otp: string }
): Promise<OtpMutationResponse> {
  const response = await api.post<OtpMutationResponse>(
    `/api/exchanges/${exchangeId}/otp/${path}`,
    body ?? {}
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'OTP request failed');
  }

  return response.data;
}

export function generateStartOtp(exchangeId: string): Promise<OtpMutationResponse> {
  return postOtpMutation(exchangeId, 'start/generate');
}

export function verifyStartOtp(
  exchangeId: string,
  otp: string
): Promise<OtpMutationResponse> {
  return postOtpMutation(exchangeId, 'start/verify', { otp });
}

export function generateCompletionOtp(exchangeId: string): Promise<OtpMutationResponse> {
  return postOtpMutation(exchangeId, 'complete/generate');
}

export function verifyCompletionOtp(
  exchangeId: string,
  otp: string
): Promise<OtpMutationResponse> {
  return postOtpMutation(exchangeId, 'complete/verify', { otp });
}
