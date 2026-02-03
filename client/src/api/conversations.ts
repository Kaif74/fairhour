import { api } from './index';
import {
  ApiConversation,
  ApiConversationListResponse,
  ApiConversationMessagesResponse,
} from '../types';

export async function getConversations(): Promise<ApiConversation[]> {
  const response = await api.get<ApiConversationListResponse>('/api/conversations');
  if (response.success && response.data) {
    return response.data.conversations;
  }
  return [];
}

export async function getConversationMessages(
  conversationId: string,
  options?: { limit?: number; offset?: number }
): Promise<ApiConversationMessagesResponse | null> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const endpoint =
    params.toString().length > 0
      ? `/api/conversations/${conversationId}/messages?${params.toString()}`
      : `/api/conversations/${conversationId}/messages`;

  const response = await api.get<ApiConversationMessagesResponse>(endpoint);
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

export async function markConversationRead(
  conversationId: string
): Promise<{ updated: number; readAt: string } | null> {
  const response = await api.post<{ updated: number; readAt: string }>(
    `/api/conversations/${conversationId}/read`
  );
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}
