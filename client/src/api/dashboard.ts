/**
 * Dashboard API
 * Fetches real data from backend for dashboard
 */

import { api } from './index';

// =============================================================================
// TYPES
// =============================================================================

export interface Service {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  occupationId?: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    location?: string | null;
    reputationScore?: number;
    profileImageUrl?: string | null;
  };
  occupation?: {
    id: string;
    title: string;
    ncoCode: string;
    majorGroup: string;
    skillLevel: number;
    baseMultiplier: number;
  } | null;
}

export interface ServiceRequest {
  id: string;
  requesterId: string;
  serviceCategory: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Exchange {
  id: string;
  providerId: string;
  requesterId: string;
  hours: number;
  status: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  provider?: { id: string; name: string };
  requester?: { id: string; name: string };
}

export interface DashboardStats {
  balance: number;
  hoursEarned: number;
  hoursSpent: number;
  servicesCount: number;
  requestsCount: number;
  activeExchanges: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get user's services
 */
export async function getMyServices(): Promise<Service[]> {
  try {
    const response = await api.get<{ services: Service[] }>('/api/services/me');
    if (response.success && response.data) {
      return response.data.services;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return [];
  }
}

/**
 * Get user's requests
 */
export async function getMyRequests(): Promise<ServiceRequest[]> {
  try {
    const response = await api.get<{ requests: ServiceRequest[] }>('/api/requests/me');
    if (response.success && response.data) {
      return response.data.requests;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    return [];
  }
}

/**
 * Get user's exchanges
 */
export async function getMyExchanges(): Promise<Exchange[]> {
  try {
    const response = await api.get<{ exchanges: Exchange[] }>('/api/exchanges/me');
    if (response.success && response.data) {
      return response.data.exchanges;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch exchanges:', error);
    return [];
  }
}

/**
 * Get all services (for browse)
 */
export async function getAllServices(): Promise<Service[]> {
  try {
    const response = await api.get<{ services: Service[] }>('/api/services');
    if (response.success && response.data) {
      return response.data.services;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch all services:', error);
    return [];
  }
}

/**
 * Create a new service
 */
export async function createService(data: {
  title: string;
  description: string;
  category: string;
}): Promise<Service> {
  const response = await api.post<{ service: Service }>('/api/services', data);
  if (response.success && response.data) {
    return response.data.service;
  }
  throw new Error(response.message || 'Failed to create service');
}

/**
 * Create a new request
 */
export async function createRequest(data: {
  serviceCategory: string;
  description: string;
}): Promise<ServiceRequest> {
  const response = await api.post<{ request: ServiceRequest }>('/api/requests', data);
  if (response.success && response.data) {
    return response.data.request;
  }
  throw new Error(response.message || 'Failed to create request');
}

export default {
  getMyServices,
  getMyRequests,
  getMyExchanges,
  getAllServices,
  createService,
  createRequest,
};
