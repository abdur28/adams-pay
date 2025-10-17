// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Load environment variables
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Validate required environment variables
if (!projectId || !clientEmail || !privateKey) {
  console.warn('Firebase Admin SDK credentials are missing. Some server-side features may not work.');
}

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

try {
  // Check if Firebase Admin is already initialized
  const existingApps = getApps();
  
  if (existingApps.length === 0 && projectId && clientEmail && privateKey) {
    // Initialize Firebase Admin
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      }),
      storageBucket,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } else if (existingApps.length > 0) {
    adminApp = existingApps[0];
    console.log('✅ Using existing Firebase Admin app');
  }

  // Get services if app is initialized
  if (adminApp) {
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
}

// Export services with null checks
export { adminApp, adminAuth, adminDb, adminStorage };

// Helper function to check if Admin SDK is available
export const isAdminInitialized = (): boolean => {
  return adminApp !== null && adminAuth !== null;
};

// Helper to verify ID token with error handling
export const verifyIdToken = async (token: string) => {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth is not initialized. Check your environment variables.');
  }
  
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error: any) {
    console.error('Token verification error:', error);
    throw new Error(`Failed to verify token: ${error.message}`);
  }
};