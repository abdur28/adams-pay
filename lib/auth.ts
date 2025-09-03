// lib/auth.ts
import { ID, Models } from 'appwrite';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, OTP_COLLECTION_ID } from '@/lib/appwrite';
import { createDocument, getDocument, updateDocument, deleteDocument, getDocumentsWhere } from '@/lib/database';
import type { 
  User, 
  CreateUserPayload, 
  LoginCredentials,
  ApiResponse 
} from '@/types/type';

// OTP Types
interface EmailOTP {
  email: string;
  otp: string;
  expiresAt: string;
  createdAt: string;
  verified: boolean;
}

interface OTPResult {
  success: boolean;
  error?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  session?: Models.Session;
  error?: string;
}

// Database document type that matches our User interface
interface UserDocument {
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

// Convert Appwrite document to User type
const documentToUser = (doc: UserDocument & Models.Document): User => {
  return {
    id: doc.$id,
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
    const result = await getDocumentsWhere<UserDocument>(USERS_COLLECTION_ID, 'email', email.toLowerCase());
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

    const otpData: EmailOTP = {
      email: normalizedEmail,
      otp,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      verified: false
    };

    // Use email as document ID to avoid duplicates
    await createDocument(
      OTP_COLLECTION_ID,
      otpData,
      normalizedEmail
    );

    // Send OTP via API
    const emailSent = await sendOTPViaAPI(normalizedEmail, otp);
    
    if (!emailSent) {
      // Clean up the OTP document if email failed to send
      await deleteDocument(OTP_COLLECTION_ID, normalizedEmail).catch(console.error);
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
    const otpDoc = await getDocument<EmailOTP>(OTP_COLLECTION_ID, normalizedEmail);

    if (!otpDoc) {
      return {
        success: false,
        error: 'No verification code found. Please request a new one.'
      };
    }

    // Check if expired
    if (new Date(otpDoc.expiresAt) < new Date()) {
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
    await updateDocument(OTP_COLLECTION_ID, normalizedEmail, {
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
    await deleteDocument(OTP_COLLECTION_ID, normalizedEmail);
  } catch (error) {
    console.error('Error cleaning up OTP:', error);
  }
};

// Find user by referral code
export const findUserByReferralCode = async (referralCode: string): Promise<User | null> => {
  try {
    const result = await getDocumentsWhere<UserDocument>(USERS_COLLECTION_ID, 'referralCode', referralCode);
    
    if (result.total === 0) {
      return null;
    }
    
    return documentToUser(result.documents[0]);
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
    const referrerDoc = await getDocument<UserDocument>(USERS_COLLECTION_ID, referrerUserId);
    
    if (!referrerDoc) {
      throw new Error('Referrer user not found');
    }

    const currentReferrals = referrerDoc.referrals || [];
    const referralCount = currentReferrals.length;
    
    // Add points only for first 20 referrals
    const pointsToAdd = referralCount < 20 ? 500 : 0;
    
    await updateDocument(USERS_COLLECTION_ID, referrerUserId, {
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
    const otpDoc = await getDocument<EmailOTP>(OTP_COLLECTION_ID, normalizedEmail);
    
    if (!otpDoc || !otpDoc.verified) {
      return {
        success: false,
        error: 'Email verification required. Please verify your email first.'
      };
    }

    // Check if OTP has expired
    if (new Date(otpDoc.expiresAt) < new Date()) {
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

    // Create Appwrite account
    const newAccount = await account.create(
      ID.unique(),
      normalizedEmail,
      userData.password,
      userData.name
    );

    // Create session for the new user
    const userSession = await account.createEmailPasswordSession(
      normalizedEmail,
      userData.password
    );

    // Create user document in database
    const now = new Date().toISOString();
    const userDocData: UserDocument = {
      name: userData.name,
      email: normalizedEmail,
      phoneNumber: userData.phoneNumber,
      role: userData.role || 'user',
      status: 'active',
      profilePicture: userData.profilePicture,
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
      USERS_COLLECTION_ID,
      userDocData,
      newAccount.$id
    );

    // Handle referral rewards if applicable
    if (referrerUser) {
      try {
        await handleReferralRewards(userDoc.$id, referrerUser.id);
      } catch (error) {
        console.error('Error processing referral rewards:', error);
        // Don't fail registration if referral reward fails
      }
    }

    // Clean up OTP after successful registration
    await cleanupVerifiedOTP(normalizedEmail);

    // Convert to User type
    const user = documentToUser(userDoc);

    return {
      success: true,
      user,
      session: userSession
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
    const session = await account.createEmailPasswordSession(
      credentials.email.toLowerCase(),
      credentials.password
    );

    // Get current user info
    const currentUser = await account.get();
    
    // Get user document from database
    const userDoc = await getDocument<UserDocument>(USERS_COLLECTION_ID, currentUser.$id);
    
    if (!userDoc) {
      throw new Error('User data not found');
    }

    // Update last login time
    const updatedDoc = await updateDocument<UserDocument>(USERS_COLLECTION_ID, currentUser.$id, {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Convert to User type
    const user = documentToUser(updatedDoc);

    return {
      success: true,
      user,
      session
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
    const currentUser = await account.get();
    const userDoc = await getDocument<UserDocument>(USERS_COLLECTION_ID, currentUser.$id);
    
    if (!userDoc) return null;

    return documentToUser(userDoc);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Sign out user
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await account.deleteSession('current');
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
    const updatedDoc = await updateDocument<UserDocument>(USERS_COLLECTION_ID, userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    const user = documentToUser(updatedDoc);

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
    await account.createRecovery(
      email.toLowerCase(),
      `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`
    );
    
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
  password: string,
  oldPassword: string
): Promise<AuthResult> => {
  try {
    await account.updatePassword(password, oldPassword);
    return { success: true };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error.message || 'Password update failed'
    };
  }
};

// Get user sessions
export const getUserSessions = async (): Promise<Models.SessionList | null> => {
  try {
    return await account.listSessions();
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return null;
  }
};

// Delete session
export const deleteSession = async (sessionId: string): Promise<AuthResult> => {
  try {
    await account.deleteSession(sessionId);
    return { success: true };
  } catch (error: any) {
    console.error('Delete session error:', error);
    return {
      success: false,
      error: error.message || 'Delete session failed'
    };
  }
};