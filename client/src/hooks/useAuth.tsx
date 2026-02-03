/**
 * useAuth Hook
 * Authentication context and hook for managing user authentication state
 *
 * @example
 * import { useAuth, AuthProvider } from '../hooks/useAuth';
 *
 * // In app root
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // In components
 * const { user, login, logout, isLoading } = useAuth();
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  completeOnboarding as apiCompleteOnboarding,
  updateProfile as apiUpdateProfile,
  LoginCredentials,
  RegisterData,
  OnboardingData,
  ProfileUpdateData,
} from '../api/auth';

// =============================================================================
// TYPES
// =============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  // Login function - returns user for redirect logic
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function - returns user for redirect logic
  const register = useCallback(async (data: RegisterData): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRegister(data);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async (data: OnboardingData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await apiCompleteOnboarding(data);
      setUser(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onboarding failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<void> => {
    setError(null);

    try {
      const updatedUser = await apiUpdateProfile(data);
      setUser(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update user (for when user data changes)
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    completeOnboarding,
    updateProfile,
    clearError,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =============================================================================
// HOOK
// =============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
