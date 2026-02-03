/**
 * Authentication API
 */

import { api, setToken, removeToken, getToken } from './index';
import { ApiUser } from '../types';

// =============================================================================
// TYPES
// =============================================================================

// Re-export ApiUser as User for backwards compatibility
export type User = ApiUser;

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  location?: string;
}

export interface OnboardingData {
  skills: string[];
  bio?: string;
  availability: string[];
  profileImageUrl?: string;
}

export interface ProfileUpdateData {
  name?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  availability?: string[];
  profileImageUrl?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/register', data, { auth: false });

  if (response.success && response.data) {
    setToken(response.data.token);
    return response.data;
  }

  throw new Error(response.message || 'Registration failed');
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/auth/login', credentials, { auth: false });

  if (response.success && response.data) {
    setToken(response.data.token);
    return response.data;
  }

  throw new Error(response.message || 'Login failed');
}

/**
 * Logout user (clear token)
 */
export function logout(): void {
  removeToken();
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!getToken()) {
    return null;
  }

  try {
    const response = await api.get<{ user: User }>('/api/users/me');

    if (response.success && response.data) {
      return response.data.user;
    }

    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    removeToken();
    return null;
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(data: OnboardingData): Promise<User> {
  const response = await api.post<{ user: User }>('/api/users/onboarding/complete', data);

  if (response.success && response.data) {
    return response.data.user;
  }

  throw new Error(response.message || 'Failed to complete onboarding');
}

/**
 * Update user profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const response = await api.patch<{ user: User }>('/api/users/profile', data);

  if (response.success && response.data) {
    return response.data.user;
  }

  throw new Error(response.message || 'Failed to update profile');
}

/**
 * Get user's time balance
 */
export async function getTimeBalance(): Promise<{
  balance: number;
  hoursEarned: number;
  hoursSpent: number;
}> {
  const response = await api.get<{ balance: number; hoursEarned: number; hoursSpent: number }>(
    '/api/users/me/balance'
  );

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get time balance');
}

/**
 * Check if user is logged in (has valid token)
 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  completeOnboarding,
  updateProfile,
  getTimeBalance,
  isLoggedIn,
};
