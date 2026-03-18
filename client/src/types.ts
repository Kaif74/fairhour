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
  walletAddress: string | null;
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
  occupationId: string | null;
  isActive: boolean;
  createdAt: string;
  user?: ApiServiceUser;
  occupation?: ApiOccupation | null;
}

/**
 * API Occupation - matches backend Occupation model
 */
export interface ApiOccupation {
  id: string;
  ncoCode: string;
  title: string;
  majorGroup: string;
  skillLevel: number; // 1-4
  baseMultiplier: number;
  description?: string;
}

/**
 * API Review - matches backend Review model
 */
export interface ApiReview {
  id: string;
  exchangeId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: ApiServiceUser;
}

/**
 * API Valuation Estimate
 */
export interface ApiValuationEstimate {
  hours: number;
  estimatedCredits: {
    min: number;
    max: number;
  };
  ratePerHour: {
    min: number;
    max: number;
  };
  breakdown: {
    skillMultiplier: number;
    skillLevel: number;
    occupationTitle: string | null;
    reputationFactor: number;
    demandFactor: number;
    averageRating: number | null;
    reviewCount: number;
  };
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
  creditsEarned: number | null;
  occupationCode: string | null;
  valuationDetails: Record<string, number | string | null> | null;
  status: ExchangeStatus;
  providerConfirmed: boolean;
  requesterConfirmed: boolean;
  blockchainTxHash: string | null;
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
  skillLevel: 'Basic' | 'Intermediate' | 'Advanced' | 'Professional';
  rating: number;
  reviewCount: number;
  costPerHour: number;
  status?: ServiceStatus;
  totalHoursDelivered?: number;
  occupation?: ApiOccupation | null;
  occupationId?: string | null;
  creditRateMin?: number;
  creditRateMax?: number;
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
 * Map skill level number to display string
 */
function skillLevelToDisplay(level?: number): 'Basic' | 'Intermediate' | 'Advanced' | 'Professional' {
  switch (level) {
    case 4: return 'Professional';
    case 3: return 'Advanced';
    case 2: return 'Intermediate';
    case 1: return 'Basic';
    default: return 'Intermediate';
  }
}

/**
 * Transform ApiService to ServiceDisplay for UI
 */
export function apiServiceToDisplay(service: ApiService): ServiceDisplay {
  const user = service.user;
  const occupation = service.occupation;
  const multiplier = occupation?.baseMultiplier ?? 1;
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
    skillLevel: skillLevelToDisplay(occupation?.skillLevel),
    rating: user?.reputationScore && user.reputationScore > 0 ? user.reputationScore : 4.5,
    reviewCount: 0,
    costPerHour: multiplier,
    occupation: occupation || null,
    occupationId: service.occupationId,
    creditRateMin: multiplier,
    creditRateMax: parseFloat(Math.min(2.5, multiplier * 1.3).toFixed(1)),
  };
}
