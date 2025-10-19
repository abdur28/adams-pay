// hooks/useActions.ts
import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  uploadFile, 
  deleteFile, 
  generateUniqueFileName, 
  validateFileSize 
} from '@/lib/storage';
import notificationService from '@/lib/notificationService';
import { 
  User, 
  SavedRecipient, 
  CreateTransactionData,
  UpdateUserPayload,
  ActionResult,
} from '@/types/type';
import { FirebaseTransaction, ReceiptFile } from '@/types/exchange';
import { formatFirestoreTimestamp, getAmountInCurrency, getDiscountInCurrency } from '@/lib/utils';

interface UseActionsStore {
  // Loading states
  loading: {
    adamPoints: boolean;
    transfer: boolean;
    recipient: boolean;
    settings: boolean;
    upload: boolean;
  };

  // Error states
  error: {
    adamPoints: string | null;
    transfer: string | null;
    recipient: string | null;
    settings: string | null;
    upload: string | null;
  };

  // Upload progress
  uploadProgress: number;

  // Transfer Actions
  getAdamsPointDiscount: ({fromAmount, fromCurrency, adamPoints}: {fromAmount: number, fromCurrency: string, adamPoints: number}) => Promise<number>;
  createTransfer: (data: CreateTransactionData, userId: string) => Promise<ActionResult>;
  uploadTransferReceipt: (
    transactionId: string,
    file: File,
    receiptType: 'fromReceipt' | 'toReceipt'
  ) => Promise<ActionResult>;
  deleteTransferReceipt: (
    transactionId: string,
    receiptType: 'fromReceipt' | 'toReceipt'
  ) => Promise<ActionResult>;
  cancelTransfer: (transactionId: string, reason?: string) => Promise<ActionResult>;
  completeTransfer: (transactionId: string, useadamPoints: boolean) => Promise<ActionResult>;

  // Recipient Actions
  saveRecipient: (recipient: Omit<SavedRecipient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  updateRecipient: (recipientId: string, data: Partial<SavedRecipient>) => Promise<ActionResult>;
  deleteRecipient: (recipientId: string) => Promise<ActionResult>;
  setDefaultRecipient: (recipientId: string, userId: string) => Promise<ActionResult>;

  // Settings Actions
  updateProfile: (userId: string, data: UpdateUserPayload) => Promise<ActionResult>;
  updateNotificationSettings: (userId: string, notifications: Partial<User['notifications']>) => Promise<ActionResult>;
  updateSecuritySettings: (userId: string, security: Partial<User['security']>) => Promise<ActionResult>;
  uploadProfilePicture: (userId: string, file: File) => Promise<ActionResult>;
  deleteProfilePicture: (userId: string) => Promise<ActionResult>;

  // Utility Actions
  clearErrors: () => void;
  clearTransferError: () => void;
  clearRecipientError: () => void;
  clearSettingsError: () => void;
  clearUploadError: () => void;
}

const useActions = create<UseActionsStore>((set, get) => ({
  // Initial States
  loading: {
    adamPoints: false,
    transfer: false,
    recipient: false,
    settings: false,
    upload: false,
  },

  error: {
    adamPoints: null,
    transfer: null,
    recipient: null,
    settings: null,
    upload: null,
  },

  uploadProgress: 0,

  // ==================== TRANSFER ACTIONS ====================

  getAdamsPointDiscount: async ({fromAmount, fromCurrency, adamPoints}: {fromAmount: number, fromCurrency: string, adamPoints: number}) => {
    set(state => ({ ...state, loading: { ...state.loading, adamPoints: true } }));
    let discountAmount: number = adamPoints / 50;
    if (fromCurrency !== 'USD') {
      try {
        const discountAmountInCurrency = await getDiscountInCurrency(discountAmount, fromCurrency);
        if (!discountAmountInCurrency) {
          throw new Error('Failed to get Adam Points in USD');
        }
        discountAmount = parseFloat(discountAmountInCurrency);
      } catch (error) {
        console.error(error);
      }
    } 
    set(state => ({ ...state, loading: { ...state.loading, adamPoints: false } }));
    return discountAmount;
  },

  // Create transfer
  createTransfer: async (data: CreateTransactionData, userId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, transfer: true },
      error: { ...state.error, transfer: null },
    }));

    try {
      // Calculate expiry time
      const expiryMinutes = data.expiryMinutes || 30;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Create transaction document
      const transactionData = {
        userId,
        type: 'transfer' as const,
        status: 'pending' as const,
        fromAmount: data.fromAmount,
        discountAmount: data.discountAmount,
        totalfromAmount: data.totalfromAmount,
        toAmount: data.toAmount,
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        exchangeRate: data.exchangeRate,
        rateId: data.rateId,
        recipientDetails: data.recipientDetails,
        expiresAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);

      set(state => ({
        loading: { ...state.loading, transfer: false },
      }));

      return { 
        success: true, 
        data: { 
          transactionId: docRef.id,
          expiresAt: expiresAt.toISOString(),
        } 
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create transfer';
      set(state => ({
        loading: { ...state.loading, transfer: false },
        error: { ...state.error, transfer: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Upload transfer receipt
  uploadTransferReceipt: async (
    transactionId: string,
    file: File,
    receiptType: 'fromReceipt' | 'toReceipt'
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, upload: true },
      error: { ...state.error, upload: null },
      uploadProgress: 0,
    }));

    try {
      // Validate file size (10MB max)
      if (!validateFileSize(file.size, 10)) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only images (JPEG, PNG, WebP) and PDF files are allowed');
      }

      // Generate unique filename and upload
      const uniqueFileName = generateUniqueFileName(file.name);
      const storagePath = `transactions/${transactionId}/receipts/${uniqueFileName}`;
      
      const downloadURL = await uploadFile(file, storagePath, (progress) => {
        set({ uploadProgress: progress });
      });

      // Prepare receipt metadata
      const receiptData: ReceiptFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL.url,
        uploadedAt: serverTimestamp(),
      };

      // Update transaction document
      const transactionRef = doc(db, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        [receiptType]: receiptData,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, upload: false },
        uploadProgress: 0,
      }));

      return { success: true, data: { receiptUrl: downloadURL } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload receipt';
      set(state => ({
        loading: { ...state.loading, upload: false },
        error: { ...state.error, upload: errorMessage },
        uploadProgress: 0,
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Delete transfer receipt
  deleteTransferReceipt: async (
    transactionId: string,
    receiptType: 'fromReceipt' | 'toReceipt'
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, upload: true },
      error: { ...state.error, upload: null },
    }));

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();
      const receiptData = transactionData[receiptType];

      if (!receiptData?.url) {
        throw new Error('No receipt found to delete');
      }

      // Delete file from storage
      await deleteFile(receiptData.url);

      // Remove receipt from transaction document
      await updateDoc(transactionRef, {
        [receiptType]: null,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, upload: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete receipt';
      set(state => ({
        loading: { ...state.loading, upload: false },
        error: { ...state.error, upload: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Cancel transfer
  cancelTransfer: async (transactionId: string, reason?: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, transfer: true },
      error: { ...state.error, transfer: null },
    }));

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      // Check if transaction can be cancelled
      if (transactionData.status !== 'pending') {
        throw new Error('Only pending transactions can be cancelled');
      }

      await deleteDoc(transactionRef);

      set(state => ({
        loading: { ...state.loading, transfer: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel transfer';
      set(state => ({
        loading: { ...state.loading, transfer: false },
        error: { ...state.error, transfer: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Complete transfer
  completeTransfer: async (transactionId: string, useAdamPoints: boolean): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, transfer: true },
      error: { ...state.error, transfer: null },
    }));

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      // Check if transaction can be completed
      if (transactionData.status !== 'pending') {
        throw new Error('Only pending transactions can be submitted');
      }

      // Check if receipt is uploaded
      if (!transactionData.fromReceipt) {
        throw new Error('Please upload payment receipt before submitting transfer');
      }

      const updateData: any = {
        status: 'processing',
        updatedAt: serverTimestamp(),
      };

      await updateDoc(transactionRef, updateData);

      // Send notification
      const userDoc = await getDoc(doc(db, 'users', transactionData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const amount = transactionData.totalfromAmount ? transactionData.totalfromAmount : transactionData.fromAmount
        let newAdamPoints = amount
        if (transactionData.fromCurrency !== 'USD') {
          const newAmount = await getAmountInCurrency(amount, transactionData.fromCurrency, 'USD');
          if (!newAmount) {
            throw new Error('Error getting discount in currency')
          }
          newAdamPoints = parseFloat(newAmount)
        } 
        if (useAdamPoints) {
          const updateData = {
            adamPoints: newAdamPoints, 
            updatedAt: serverTimestamp(),          
          }
          await updateDoc(doc(db, 'users', transactionData.userId), updateData);
          console.log(newAdamPoints, userData.adamPoints, amount)
        } else {
          const updateData = {
            adamPoints: !isNaN(userData.adamPoints) ? userData.adamPoints + newAdamPoints : newAdamPoints,
            updatedAt: serverTimestamp(),
          }
          await updateDoc(doc(db, 'users', transactionData.userId), updateData);
           console.log(newAdamPoints, userData.adamPoints, amount)
        }
        await notificationService.sendTransactionNotification({
          transactionId,
          userId: transactionData.userId,
          userEmail: userData.email,
          userName: userData.name || 'User',
          title: 'Transfer Submitted',
          body: `Your transfer of ${transactionData.totalfromAmount ? transactionData.totalfromAmount : transactionData.fromAmount} ${transactionData.fromCurrency} has been submitted and is being processed.`,
          transactionData: {
            ...transactionData,
            status: 'processing',
          },
          notifyUser: true,
          notifyAdmins: true,
        });
      }

      set(state => ({
        loading: { ...state.loading, transfer: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to submit transfer';
      set(state => ({
        loading: { ...state.loading, transfer: false },
        error: { ...state.error, transfer: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // ==================== RECIPIENT ACTIONS ====================

  // Save recipient
  saveRecipient: async (
    recipient: Omit<SavedRecipient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      const recipientData = {
        ...recipient,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'savedRecipients'), recipientData);

      set(state => ({
        loading: { ...state.loading, recipient: false },
      }));

      return { success: true, data: { recipientId: docRef.id } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save recipient';
      set(state => ({
        loading: { ...state.loading, recipient: false },
        error: { ...state.error, recipient: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Update recipient
  updateRecipient: async (
    recipientId: string,
    data: Partial<SavedRecipient>
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      const recipientRef = doc(db, 'savedRecipients', recipientId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(recipientRef, updateData);

      set(state => ({
        loading: { ...state.loading, recipient: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update recipient';
      set(state => ({
        loading: { ...state.loading, recipient: false },
        error: { ...state.error, recipient: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Delete recipient
  deleteRecipient: async (recipientId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      await deleteDoc(doc(db, 'savedRecipients', recipientId));

      set(state => ({
        loading: { ...state.loading, recipient: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete recipient';
      set(state => ({
        loading: { ...state.loading, recipient: false },
        error: { ...state.error, recipient: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Set default recipient
  setDefaultRecipient: async (recipientId: string, userId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      // First, unset all other default recipients for this user
      const recipientsQuery = query(
        collection(db, 'savedRecipients'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      const snapshot = await getDocs(recipientsQuery);

      const unsetPromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
      );
      await Promise.all(unsetPromises);

      // Set the new default recipient
      const recipientRef = doc(db, 'savedRecipients', recipientId);
      await updateDoc(recipientRef, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, recipient: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set default recipient';
      set(state => ({
        loading: { ...state.loading, recipient: false },
        error: { ...state.error, recipient: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // ==================== SETTINGS ACTIONS ====================

  // Update profile
  updateProfile: async (userId: string, data: UpdateUserPayload): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, settings: true },
      error: { ...state.error, settings: null },
    }));

    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(userRef, updateData);

      set(state => ({
        loading: { ...state.loading, settings: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      set(state => ({
        loading: { ...state.loading, settings: false },
        error: { ...state.error, settings: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Update notification settings
  updateNotificationSettings: async (
    userId: string,
    notifications: Partial<User['notifications']>
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, settings: true },
      error: { ...state.error, settings: null },
    }));

    try {
      const userRef = doc(db, 'users', userId);
      
      // Get current notifications
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentNotifications = userDoc.data().notifications || {};
      const updatedNotifications = {
        ...currentNotifications,
        ...notifications,
      };

      await updateDoc(userRef, {
        notifications: updatedNotifications,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, settings: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update notification settings';
      set(state => ({
        loading: { ...state.loading, settings: false },
        error: { ...state.error, settings: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Update security settings
  updateSecuritySettings: async (
    userId: string,
    security: Partial<User['security']>
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, settings: true },
      error: { ...state.error, settings: null },
    }));

    try {
      const userRef = doc(db, 'users', userId);
      
      // Get current security settings
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentSecurity = userDoc.data().security || {};
      const updatedSecurity = {
        ...currentSecurity,
        ...security,
      };

      await updateDoc(userRef, {
        security: updatedSecurity,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, settings: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update security settings';
      set(state => ({
        loading: { ...state.loading, settings: false },
        error: { ...state.error, settings: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (userId: string, file: File): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, upload: true },
      error: { ...state.error, upload: null },
      uploadProgress: 0,
    }));

    try {
      // Validate file size (5MB max for profile pictures)
      if (!validateFileSize(file.size, 5)) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only images (JPEG, PNG, WebP) are allowed');
      }

      // Get current profile picture to delete
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentProfilePicture = userDoc.data().profilePicture;
        if (currentProfilePicture) {
          try {
            await deleteFile(currentProfilePicture);
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
            // Continue even if deletion fails
          }
        }
      }

      // Generate unique filename and upload
      const uniqueFileName = generateUniqueFileName(file.name);
      const storagePath = `users/${userId}/profile/${uniqueFileName}`;
      
      const downloadURL = await uploadFile(file, storagePath, (progress) => {
        set({ uploadProgress: progress });
      });

      // Update user document
      await updateDoc(userRef, {
        profilePicture: downloadURL,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, upload: false },
        uploadProgress: 0,
      }));

      return { success: true, data: { profilePictureUrl: downloadURL } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload profile picture';
      set(state => ({
        loading: { ...state.loading, upload: false },
        error: { ...state.error, upload: errorMessage },
        uploadProgress: 0,
      }));
      return { success: false, error: errorMessage };
    }
  },

  // Delete profile picture
  deleteProfilePicture: async (userId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, upload: true },
      error: { ...state.error, upload: null },
    }));

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const profilePictureUrl = userDoc.data().profilePicture;

      if (!profilePictureUrl) {
        throw new Error('No profile picture to delete');
      }

      // Delete file from storage
      await deleteFile(profilePictureUrl);

      // Update user document
      await updateDoc(userRef, {
        profilePicture: null,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        loading: { ...state.loading, upload: false },
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete profile picture';
      set(state => ({
        loading: { ...state.loading, upload: false },
        error: { ...state.error, upload: errorMessage },
      }));
      return { success: false, error: errorMessage };
    }
  },

  // ==================== UTILITY ACTIONS ====================

  clearErrors: () => set({
    error: {
      adamPoints: null,
      transfer: null,
      recipient: null,
      settings: null,
      upload: null,
    },
  }),

  clearTransferError: () => set(state => ({
    error: { ...state.error, transfer: null },
  })),

  clearRecipientError: () => set(state => ({
    error: { ...state.error, recipient: null },
  })),

  clearSettingsError: () => set(state => ({
    error: { ...state.error, settings: null },
  })),

  clearUploadError: () => set(state => ({
    error: { ...state.error, upload: null },
  })),
}));

export default useActions;