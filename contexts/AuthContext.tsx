"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, CreateUserPayload, LoginCredentials } from '@/types/type';
import {
  getCurrentUser,
  registerUser,
  signInUser,
  signOutUser,
  updateUserProfile,
  resetPassword,
  updatePassword,
  onAuthChange,
  generateAndSendOTP,
  verifyEmailOTP,
  signInWithGoogle,
  handleGoogleRedirectResult
} from '@/lib/auth';
import { setSessionCookie, clearSessionCookie } from '@/lib/sessionCookie';

interface AuthContextType {
  // User state
  user: User | null;
  profile: User | null; // Alias for user
  isAuthenticated: boolean;
  authInitialized: boolean;
  loading: boolean;
  error: string | null;

  // Auth methods
  register: (userData: CreateUserPayload) => Promise<{ success: boolean; error?: string }>;
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signInGoogle: (referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // OTP methods
  sendOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;

  // Utility methods
  refetch: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  }, []);

  // Handle Google redirect result on mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        if (result && result.success && result.user) {
          setUser(result.user);
          router.push('/');
        }
      } catch (err) {
        console.error('Error handling Google redirect:', err);
      }
    };

    handleRedirect();
  }, [router]);

  // Initialize auth state listener
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
      setLoading(false);
      
      // Set or clear session cookie based on auth state
      if (currentUser) {
        await setSessionCookie();
      } else {
        await clearSessionCookie();
      }
    });

    return () => unsubscribe();
  }, []);

  // Register function
  const register = async (userData: CreateUserPayload) => {
    try {
      setLoading(true);
      setError(null);

      const result = await registerUser(userData);

      if (result.success && result.user) {
        setUser(result.user);
        await setSessionCookie();
        return { success: true };
      } else {
        setError(result.error || 'Registration failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInUser(credentials);

      if (result.success && result.user) {
        setUser(result.user);
        await setSessionCookie();
        return { success: true };
      } else {
        setError(result.error || 'Sign in failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In function
  const signInGoogle = async (referralCode?: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithGoogle(referralCode);

      if (result.success && result.user) {
        setUser(result.user);
        await setSessionCookie();
        return { success: true };
      } else {
        setError(result.error || 'Google sign in failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signOutUser();

      if (result.success) {
        setUser(null);
        await clearSessionCookie();
        router.push('/sign-in');
        return { success: true };
      } else {
        setError(result.error || 'Sign out failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (userId: string, updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateUserProfile(userId, updates);

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error || 'Profile update failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updatePassword(newPassword);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Password update failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Password update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await resetPassword(email);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Password reset failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Send OTP function
  const sendOTP = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await generateAndSendOTP(email);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'Failed to send OTP');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await verifyEmailOTP(email, otp);

      if (result.success) {
        return { success: true };
      } else {
        setError(result.error || 'OTP verification failed');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'OTP verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Refetch user
  const refetch = async () => {
    await fetchUser();
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    profile: user, // Alias
    isAuthenticated: !!user,
    authInitialized,
    loading,
    error,
    register,
    signIn,
    signInGoogle,
    signOut,
    updateProfile,
    changePassword,
    forgotPassword,
    sendOTP,
    verifyOTP,
    refetch,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};