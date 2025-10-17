// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, USERS_COLLECTION, OTP_COLLECTION } from '@/lib/firebase';
import { createDocument, getDocument, updateDocument, deleteDocument, getDocumentsWhere } from '@/lib/database';
import type { 
  User, 
  CreateUserPayload, 
  LoginCredentials
} from '@/types/type';

// OTP Types
interface EmailOTP {
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  verified: boolean;
}

interface OTPResult {
  success: boolean;
  error?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Database document type that matches our User interface
interface UserDocument {
  id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  profilePicture?: string;
  adamPoints: number;
  referralCode: string;
  referrals: string[];
  notifications: {
    newsAndUpdates: boolean;
    promotions: boolean;
  };
  security: {
    biometricsEnabled: boolean;
  };
  addedAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Constants
const OTP_EXPIRY_MINUTES = 15;

// Generate a random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Convert Firestore document to User type
const documentToUser = (doc: UserDocument & { id: string }): User => {
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email,
    phoneNumber: doc.phoneNumber,
    role: doc.role,
    status: doc.status,
    profilePicture: doc.profilePicture,
    adamPoints: doc.adamPoints,
    referralCode: doc.referralCode,
    referrals: doc.referrals,
    notifications: doc.notifications,
    security: doc.security,
    addedAt: doc.addedAt,
    updatedAt: doc.updatedAt,
    lastLoginAt: doc.lastLoginAt
  };
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const result = await getDocumentsWhere<UserDocument>(USERS_COLLECTION, 'email', email.toLowerCase());
    return result.total > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

// Send OTP via API
const sendOTPViaAPI = async (email: string, otp: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending OTP via API:', error);
    return false;
  }
};

// Generate, store OTP and send email
export const generateAndSendOTP = async (email: string): Promise<OTPResult> => {
  try {
    const normalizedEmail = email.toLowerCase();
    
    // Check if email already exists
    const emailExists = await checkEmailExists(normalizedEmail);
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email already exists'
      };
    }

    const otp = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (OTP_EXPIRY_MINUTES * 60 * 1000));

    const otpData = {
      email: normalizedEmail,
      otp,
      expiresAt,
      createdAt: now,
      verified: false
    };

    // Use email as document ID to avoid duplicates
    await createDocument(
      OTP_COLLECTION,
      otpData,
      normalizedEmail
    );

    // Send OTP via API
    const emailSent = await sendOTPViaAPI(normalizedEmail, otp);
    
    if (!emailSent) {
      // Clean up the OTP document if email failed to send
      await deleteDocument(OTP_COLLECTION, normalizedEmail).catch(console.error);
      return {
        success: false,
        error: 'Failed to send verification code'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error generating and sending OTP:', error);
    return {
      success: false,
      error: 'Failed to generate verification code'
    };
  }
};

// Verify OTP
export const verifyEmailOTP = async (email: string, otp: string): Promise<OTPResult> => {
  try {
    const normalizedEmail = email.toLowerCase();
    
    // Get OTP document
    const otpDoc = await getDocument<EmailOTP>(OTP_COLLECTION, normalizedEmail);

    if (!otpDoc) {
      return {
        success: false,
        error: 'No verification code found. Please request a new one.'
      };
    }

    // Check if expired
    const expiresAt = otpDoc.expiresAt instanceof Date ? otpDoc.expiresAt : new Date(otpDoc.expiresAt);
    if (expiresAt < new Date()) {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      };
    }

    // Check if already verified
    if (otpDoc.verified) {
      return { success: true };
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      return {
        success: false,
        error: 'Invalid verification code'
      };
    }

    // Mark as verified
    await updateDocument(OTP_COLLECTION, normalizedEmail, {
      verified: true
    });

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: 'Failed to verify code'
    };
  }
};

// Clean up verified OTP
const cleanupVerifiedOTP = async (email: string): Promise<void> => {
  try {
    const normalizedEmail = email.toLowerCase();
    await deleteDocument(OTP_COLLECTION, normalizedEmail);
  } catch (error) {
    console.error('Error cleaning up OTP:', error);
  }
};

// Find user by referral code
export const findUserByReferralCode = async (referralCode: string): Promise<User | null> => {
  try {
    const result = await getDocumentsWhere<UserDocument>(USERS_COLLECTION, 'referralCode', referralCode);
    
    if (result.total === 0) {
      return null;
    }
    
    return documentToUser({ ...result.documents[0], id: result.documents[0].id! });
  } catch (error) {
    console.error('Error finding user by referral code:', error);
    return null;
  }
};

// Handle referral rewards
const handleReferralRewards = async (
  newUserId: string,
  referrerUserId: string
): Promise<void> => {
  try {
    const referrerDoc = await getDocument<UserDocument>(USERS_COLLECTION, referrerUserId);
    
    if (!referrerDoc) {
      throw new Error('Referrer user not found');
    }

    const currentReferrals = referrerDoc.referrals || [];
    const referralCount = currentReferrals.length;
    
    // Add points only for first 20 referrals
    const pointsToAdd = referralCount < 20 ? 500 : 0;
    
    await updateDocument(USERS_COLLECTION, referrerUserId, {
      adamPoints: referrerDoc.adamPoints + pointsToAdd,
      referrals: [...currentReferrals, newUserId],
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling referral rewards:', error);
    throw error;
  }
};

// Register new user - requires OTP verification
export const registerUser = async (userData: CreateUserPayload): Promise<AuthResult> => {
  try {
    const normalizedEmail = userData.email.toLowerCase();
    
    // Verify that OTP was verified for this email
    const otpDoc = await getDocument<EmailOTP>(OTP_COLLECTION, normalizedEmail);
    
    if (!otpDoc || !otpDoc.verified) {
      return {
        success: false,
        error: 'Email verification required. Please verify your email first.'
      };
    }

    // Check if OTP has expired
    const expiresAt = otpDoc.expiresAt instanceof Date ? otpDoc.expiresAt : new Date(otpDoc.expiresAt);
    if (expiresAt < new Date()) {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      };
    }

    // Validate referral code if provided
    let referrerUser: User | null = null;
    if (userData.referralCode && userData.referralCode.trim() !== '') {
      referrerUser = await findUserByReferralCode(userData.referralCode.trim());
      if (!referrerUser) {
        return {
          success: false,
          error: 'Invalid referral code. Please check and try again.'
        };
      }
    }

    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      userData.password
    );

    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: userData.name
    });

    // Create user document in Firestore
    const now = new Date().toISOString();
    const userDocData: UserDocument = {
      name: userData.name,
      email: normalizedEmail,
      role: userData.role || 'user',
      status: 'active',
      ...(userData.phoneNumber ? { phoneNumber: userData.phoneNumber } : {}),
      ...(userData.profilePicture ? { profilePicture: userData.profilePicture } : {}),
      adamPoints: 0,
      referralCode: generateReferralCode(),
      referrals: [],
      notifications: {
        newsAndUpdates: true,
        promotions: true
      },
      security: {
        biometricsEnabled: false
      },
      addedAt: now,
      updatedAt: now,
      lastLoginAt: now
    };

    const userDoc = await createDocument<UserDocument>(
      USERS_COLLECTION,
      userDocData,
      firebaseUser.uid
    );

    // Handle referral rewards if applicable
    if (referrerUser) {
      try {
        await handleReferralRewards(firebaseUser.uid, referrerUser.id);
      } catch (error) {
        console.error('Error processing referral rewards:', error);
        // Don't fail registration if referral reward fails
      }
    }

    // Clean up OTP after successful registration
    await cleanupVerifiedOTP(normalizedEmail);

    // Convert to User type
    const user = documentToUser({ ...userDoc, id: firebaseUser.uid });

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

// Sign in user
export const signInUser = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email.toLowerCase(),
      credentials.password
    );

    const firebaseUser = userCredential.user;
    
    // Get user document from Firestore
    const userDoc = await getDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid);
    
    if (!userDoc) {
      throw new Error('User data not found');
    }

    // Update last login time
    const updatedDoc = await updateDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid, {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Convert to User type
    const user = documentToUser({ ...updatedDoc, id: firebaseUser.uid });

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Sign in failed'
    };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        
        if (!firebaseUser) {
          resolve(null);
          return;
        }

        try {
          const userDoc = await getDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid);
          
          if (!userDoc) {
            resolve(null);
            return;
          }

          resolve(documentToUser({ ...userDoc, id: firebaseUser.uid }));
        } catch (error) {
          console.error('Error getting user document:', error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Sign out user
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Sign out failed'
    };
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserDocument, 'email' | 'addedAt'>>
): Promise<AuthResult> => {
  try {
    const updatedDoc = await updateDocument<UserDocument>(USERS_COLLECTION, userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    const user = documentToUser({ ...updatedDoc, id: userId });

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error.message || 'Profile update failed'
    };
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    await sendPasswordResetEmail(auth, email.toLowerCase());
    
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message || 'Password reset failed'
    };
  }
};

// Update password
export const updatePassword = async (
  newPassword: string
): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        error: 'No user logged in'
      };
    }

    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error.message || 'Password update failed'
    };
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userDoc = await getDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid);
      
      if (!userDoc) {
        callback(null);
        return;
      }

      callback(documentToUser({ ...userDoc, id: firebaseUser.uid }));
    } catch (error) {
      console.error('Error in auth state change:', error);
      callback(null);
    }
  });
};

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google (popup method)
 * @param referralCode Optional referral code for new users
 * @returns Promise with authentication result
 */
export const signInWithGoogle = async (referralCode?: string): Promise<AuthResult> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Check if user document exists
    let userDoc = await getDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid);

    if (!userDoc) {
      // New user - create user document
      const now = new Date().toISOString();
      
      // Validate referral code if provided
      let referrerUser: User | null = null;
      if (referralCode && referralCode.trim() !== '') {
        referrerUser = await findUserByReferralCode(referralCode.trim());
        if (!referrerUser) {
          // Don't fail signup if referral code is invalid for Google sign-in
          console.warn('Invalid referral code provided:', referralCode);
        }
      }

      const userDocData: UserDocument = {
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email!,
        role: 'user',
        status: 'active',
        ...(firebaseUser.phoneNumber ? { phoneNumber: firebaseUser.phoneNumber } : {}),
        ...(firebaseUser.photoURL ? { profilePicture: firebaseUser.photoURL } : {}),
        adamPoints: 0,
        referralCode: generateReferralCode(),
        referrals: [],
        notifications: {
          newsAndUpdates: true,
          promotions: true
        },
        security: {
          biometricsEnabled: false
        },
        addedAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      userDoc = await createDocument<UserDocument>(
        USERS_COLLECTION,
        userDocData,
        firebaseUser.uid
      );

      // Handle referral rewards if applicable
      if (referrerUser) {
        try {
          await handleReferralRewards(firebaseUser.uid, referrerUser.id);
        } catch (error) {
          console.error('Error processing referral rewards:', error);
        }
      }
    } else {
      // Existing user - update last login
      userDoc = await updateDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid, {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const user = documentToUser({ ...userDoc, id: firebaseUser.uid });

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Sign-in cancelled'
      };
    }
    
    if (error.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: 'Pop-up blocked. Please allow pop-ups for this site.'
      };
    }

    return {
      success: false,
      error: error.message || 'Google sign-in failed'
    };
  }
};

/**
 * Sign in with Google (redirect method - better for mobile)
 * Call this to initiate the redirect
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error('Google redirect sign-in error:', error);
    throw error;
  }
};

/**
 * Handle Google redirect result
 * Call this in your app initialization to handle the redirect callback
 * @param referralCode Optional referral code for new users
 * @returns Promise with authentication result or null if no redirect
 */
export const handleGoogleRedirectResult = async (referralCode?: string): Promise<AuthResult | null> => {
  try {
    const result = await getRedirectResult(auth);
    
    if (!result) {
      return null; // No redirect result
    }

    const firebaseUser = result.user;

    // Check if user document exists
    let userDoc = await getDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid);

    if (!userDoc) {
      // New user - create user document
      const now = new Date().toISOString();
      
      // Validate referral code if provided
      let referrerUser: User | null = null;
      if (referralCode && referralCode.trim() !== '') {
        referrerUser = await findUserByReferralCode(referralCode.trim());
      }

      const userDocData: UserDocument = {
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email!,
        ...(firebaseUser.phoneNumber ? { phoneNumber: firebaseUser.phoneNumber } : {}),
        ...(firebaseUser.photoURL ? { profilePicture: firebaseUser.photoURL } : {}),
        role: 'user',
        status: 'active',
        adamPoints: 0,
        referralCode: generateReferralCode(),
        referrals: [],
        notifications: {
          newsAndUpdates: true,
          promotions: true
        },
        security: {
          biometricsEnabled: false
        },
        addedAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      userDoc = await createDocument<UserDocument>(
        USERS_COLLECTION,
        userDocData,
        firebaseUser.uid
      );

      // Handle referral rewards if applicable
      if (referrerUser) {
        try {
          await handleReferralRewards(firebaseUser.uid, referrerUser.id);
        } catch (error) {
          console.error('Error processing referral rewards:', error);
        }
      }
    } else {
      // Existing user - update last login
      userDoc = await updateDocument<UserDocument>(USERS_COLLECTION, firebaseUser.uid, {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const user = documentToUser({ ...userDoc, id: firebaseUser.uid });

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Google redirect result error:', error);
    return {
      success: false,
      error: error.message || 'Google sign-in failed'
    };
  }
};