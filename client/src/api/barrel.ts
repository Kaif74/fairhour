/**
 * API Barrel Export
 * Import API utilities from this file for cleaner imports
 *
 * @example
 * import { api, getToken, setToken, isAuthenticated } from '../api';
 */

export {
  api,
  apiRequest,
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  ApiError,
  type ApiResponse,
} from './index';

export {
  login,
  register,
  logout,
  getCurrentUser,
  completeOnboarding,
  updateProfile,
  getTimeBalance,
  isLoggedIn,
  type User,
  type AuthResponse,
  type LoginCredentials,
  type RegisterData,
  type OnboardingData,
  type ProfileUpdateData,
} from './auth';

export {
  getConversations,
  getConversationMessages,
  markConversationRead,
} from './conversations';
