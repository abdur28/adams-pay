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
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirebaseTransaction } from '@/types/exchange';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface AuthContextType {
  // User state
  user: User | null;
  profile: User | null; // Alias for user
  isAdmin: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  loading: boolean;
  error: string | null;
  
  // Pending transactions
  pendingTransactions: FirebaseTransaction[];

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
  const [pendingTransactions, setPendingTransactions] = useState<FirebaseTransaction[]>([]);
  const router = useRouter();

  // Check and clean expired transactions
  const checkAndCleanExpiredTransactions = useCallback(async (userId: string) => {
    try {
      const now = new Date();
      
      // Query pending transactions for the user
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(transactionsQuery);
      
      const expiredTransactions: string[] = [];
      const activeTransactions: FirebaseTransaction[] = [];

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const transaction: FirebaseTransaction = {
          id: docSnapshot.id,
          ...data,
          createdAt: formatFirestoreTimestamp(data.createdAt),
          updatedAt: formatFirestoreTimestamp(data.updatedAt),
          completedAt: formatFirestoreTimestamp(data.completedAt),
          cancelledAt: formatFirestoreTimestamp(data.cancelledAt),
        } as FirebaseTransaction;

        // Parse expiry time
        let expiryTime: Date;
        if (typeof data.expiresAt === 'string') {
          expiryTime = new Date(data.expiresAt);
        } else if (data.expiresAt?.toDate) {
          expiryTime = data.expiresAt.toDate();
        } else if (data.expiresAt?.seconds) {
          expiryTime = new Date(data.expiresAt.seconds * 1000);
        } else {
          // If no valid expiry, consider it expired
          expiredTransactions.push(docSnapshot.id);
          return;
        }

        // Check if expired
        if (expiryTime <= now) {
          expiredTransactions.push(docSnapshot.id);
        } else {
          activeTransactions.push(transaction);
        }
      });

      // Delete expired transactions
      if (expiredTransactions.length > 0) {
        const deletePromises = expiredTransactions.map((transactionId) =>
          deleteDoc(doc(db, 'transactions', transactionId))
        );
        await Promise.all(deletePromises);
        console.log(`Deleted ${expiredTransactions.length} expired transaction(s)`);
      }

      // Update state with active pending transactions
      setPendingTransactions(activeTransactions);
      
    } catch (error) {
      console.error('Error checking expired transactions:', error);
    }
  }, []);

  // Fetch current user and check transactions
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);

      // Check for expired transactions if user is authenticated
      if (currentUser?.id) {
        await checkAndCleanExpiredTransactions(currentUser.id);
      } else {
        setPendingTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to fetch user');
      setUser(null);
      setPendingTransactions([]);
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  }, [checkAndCleanExpiredTransactions]);

  // Handle Google redirect result on mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        if (result && result.success && result.user) {
          setUser(result.user);
          if (result.user.id) {
            await checkAndCleanExpiredTransactions(result.user.id);
          }
          router.push('/');
        }
      } catch (err) {
        console.error('Error handling Google redirect:', err);
      }
    };

    handleRedirect();
  }, [router, checkAndCleanExpiredTransactions]);

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
        // Check for expired transactions
        if (currentUser.id) {
          await checkAndCleanExpiredTransactions(currentUser.id);
        }
      } else {
        await clearSessionCookie();
        setPendingTransactions([]);
      }
    });

    return () => unsubscribe();
  }, [checkAndCleanExpiredTransactions]);

  // Set up interval to check transactions every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      checkAndCleanExpiredTransactions(user.id);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, checkAndCleanExpiredTransactions]);

  // Register function
  const register = async (userData: CreateUserPayload) => {
    try {
      setLoading(true);
      setError(null);

      const result = await registerUser(userData);

      if (result.success && result.user) {
        setUser(result.user);
        await setSessionCookie();
        if (result.user.id) {
          await checkAndCleanExpiredTransactions(result.user.id);
        }
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
        if (result.user.id) {
          await checkAndCleanExpiredTransactions(result.user.id);
        }
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
        if (result.user.id) {
          await checkAndCleanExpiredTransactions(result.user.id);
        }
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
        setPendingTransactions([]);
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

  // Refetch user and transactions
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
    isAdmin: user?.role === 'admin',
    authInitialized,
    loading,
    error,
    pendingTransactions,
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