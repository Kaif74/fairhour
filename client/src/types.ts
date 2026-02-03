// =============================================================================
// ENUMS
// =============================================================================

export enum UserRole {
  PROVIDER = 'PROVIDER',
  SEEKER = 'SEEKER',
  BOTH = 'BOTH',
}

export type ServiceStatus = 'Active' | 'Paused';
export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExchangeStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type ConversationStatus = 'ACTIVE' | 'LOCKED';

// =============================================================================
// API TYPES - Aligned with backend responses
// =============================================================================

/**
 * User stats included in API responses
 */
export interface UserStats {
  servicesCount: number;
  requestsCount: number;
  exchangesAsProvider: number;
  exchangesAsRequester: number;
}

/**
 * API User - matches backend User model
 */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  location: string | null;
  reputationScore: number;
  hasOnboarded: boolean;
  skills: string[];
  bio: string | null;
  profileImageUrl: string | null;
  availability: string[];
  createdAt: string;
  stats?: UserStats;
}

/**
 * Minimal user info included in service responses
 */
export interface ApiServiceUser {
  id: string;
  name: string;
  location?: string | null;
  reputationScore?: number;
  profileImageUrl?: string | null;
}

/**
 * API Service - matches backend Service model
 */
export interface ApiService {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  user?: ApiServiceUser;
}

/**
 * API Request - matches backend Request model
 */
export interface ApiRequest {
  id: string;
  requesterId: string;
  title: string;
  serviceCategory: string;
  description: string;
  hours: number;
  status: RequestStatus;
  createdAt: string;
  requester?: ApiServiceUser;
}

/**
 * API Exchange - matches backend Exchange model
 */
export interface ApiExchange {
  id: string;
  providerId: string;
  requesterId: string;
  hours: number;
  status: ExchangeStatus;
  providerConfirmed: boolean;
  requesterConfirmed: boolean;
  createdAt: string;
  completedAt: string | null;
  provider?: ApiServiceUser;
  requester?: ApiServiceUser;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiServicesResponse {
  services: ApiService[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ApiRequestsResponse {
  requests: ApiRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// =============================================================================
// UI DISPLAY TYPES - For frontend display components
// =============================================================================

/**
 * Service display type - used for service cards in Browse page
 */
export interface ServiceDisplay {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerLocation?: string;
  title: string;
  description: string;
  category: string;
  skillLevel: 'Basic' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewCount: number;
  costPerHour: number;
  status?: ServiceStatus;
  totalHoursDelivered?: number;
}

/**
 * Testimonial for landing page
 */
export interface Testimonial {
  id: string;
  name: string;
  role: 'Service Provider' | 'Service Seeker';
  location: string;
  avatar: string;
  text: string;
  rating: number;
  stat: string;
}

/**
 * Exchange request display type
 */
export interface ExchangeRequestDisplay {
  id: string;
  serviceTitle: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  date: string;
  hours: number;
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled';
  role?: 'Provider' | 'Requester';
}

/**
 * Chat message returned by the API
 */
export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

/**
 * Conversation metadata returned by the API
 */
export interface ApiConversation {
  id: string;
  exchangeId: string;
  status: ConversationStatus;
  serviceTitle: string | null;
  otherUser: ApiServiceUser;
  lastMessage: ApiMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ApiConversationListResponse {
  conversations: ApiConversation[];
}

export interface ApiConversationMessagesResponse {
  conversation: ApiConversation & {
    exchange?: {
      id: string;
      status: ExchangeStatus;
      providerId: string;
      requesterId: string;
      hours: number;
    };
  };
  messages: ApiMessage[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Activity item for activity feed
 */
export interface ActivityItem {
  id: string;
  serviceName: string;
  counterpartyName: string;
  counterpartyAvatar: string;
  date: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled' | 'Disputed';
  hours: number;
  description: string;
  role: 'Provider' | 'Requester';
}

// =============================================================================
// LEGACY TYPES - For backwards compatibility (deprecated)
// =============================================================================

/**
 * @deprecated Use ApiUser instead
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string;
  bio: string;
  avatarUrl: string;
  timeBalance: number;
  rating: number;
  completedExchanges: number;
  skills: string[];
}

/**
 * @deprecated Use ServiceDisplay instead
 */
export interface Service {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerLocation?: string;
  title: string;
  description: string;
  category: string;
  skillLevel: 'Basic' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewCount: number;
  costPerHour: number;
  status?: ServiceStatus;
  totalHoursDelivered?: number;
}

/**
 * @deprecated Use ExchangeRequestDisplay instead
 */
export interface ExchangeRequest {
  id: string;
  serviceTitle: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  date: string;
  hours: number;
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled';
  role?: 'Provider' | 'Requester';
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Transform ApiService to ServiceDisplay for UI
 */
export function apiServiceToDisplay(service: ApiService): ServiceDisplay {
  const user = service.user;
  return {
    id: service.id,
    providerId: service.userId,
    providerName: user?.name || 'Unknown',
    providerAvatar:
      user?.profileImageUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=22c55e&color=fff`,
    providerLocation: user?.location || 'Location not set',
    title: service.title,
    description: service.description,
    category: service.category,
    skillLevel: 'Intermediate',
    rating: user?.reputationScore && user.reputationScore > 0 ? user.reputationScore : 4.5,
    reviewCount: 0,
    costPerHour: 1,
  };
}
