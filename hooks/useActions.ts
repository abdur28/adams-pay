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
  ContactPayload,
} from '@/types/type';
import { FirebaseTransaction, ReceiptFile } from '@/types/exchange';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface UseActionsStore {
  loading: {
    transfer: boolean;
    recipient: boolean;
    settings: boolean;
    upload: boolean;
    contact: boolean;
    newsLetter: boolean;
  };

  error: {
    transfer: string | null;
    recipient: string | null;
    settings: string | null;
    upload: string | null;
    contact: string | null;
    newsLetter: string | null;
  };

  uploadProgress: number;

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
  completeTransfer: (transactionId: string, useAdamPoints: boolean) => Promise<ActionResult>;

  saveRecipient: (recipient: Omit<SavedRecipient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  updateRecipient: (recipientId: string, data: Partial<SavedRecipient>) => Promise<ActionResult>;
  deleteRecipient: (recipientId: string) => Promise<ActionResult>;
  setDefaultRecipient: (recipientId: string, userId: string) => Promise<ActionResult>;

  updateProfile: (userId: string, data: UpdateUserPayload) => Promise<ActionResult>;
  updateNotificationSettings: (userId: string, notifications: Partial<User['notifications']>) => Promise<ActionResult>;
  updateSecuritySettings: (userId: string, security: Partial<User['security']>) => Promise<ActionResult>;
  uploadProfilePicture: (userId: string, file: File) => Promise<ActionResult>;
  deleteProfilePicture: (userId: string) => Promise<ActionResult>;

  sendContact: (data: ContactPayload) => Promise<ActionResult>;
  sendNewsLetter: (email: string) => Promise<ActionResult>;

  clearErrors: () => void;
  clearTransferError: () => void;
  clearRecipientError: () => void;
  clearSettingsError: () => void;
  clearUploadError: () => void;
  clearContactError: () => void;
  clearNewsLetterError: () => void;
}

const useActions = create<UseActionsStore>((set, get) => ({
  loading: {
    transfer: false,
    recipient: false,
    settings: false,
    upload: false,
    contact: false,
    newsLetter: false,
  },

  error: {
    transfer: null,
    recipient: null,
    settings: null,
    upload: null,
    contact: null,
    newsLetter: null,
  },

  uploadProgress: 0,

  createTransfer: async (data: CreateTransactionData, userId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, transfer: true },
      error: { ...state.error, transfer: null },
    }));

    try {
      const expiryMinutes = data.expiryMinutes || 30;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

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
      if (!validateFileSize(file.size, 10)) {
        throw new Error('File size must be less than 10MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only images (JPEG, PNG, WebP) and PDF files are allowed');
      }

      const uniqueFileName = generateUniqueFileName(file.name);
      const storagePath = `transactions/${transactionId}/receipts/${uniqueFileName}`;
      
      const downloadURL = await uploadFile(file, storagePath, (progress) => {
        set({ uploadProgress: progress });
      });

      const receiptData: ReceiptFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL.url,
        uploadedAt: serverTimestamp(),
      };

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

      const receiptData = transactionDoc.data()[receiptType];

      if (!receiptData || !receiptData.url) {
        throw new Error('No receipt found');
      }

      await deleteFile(receiptData.url);

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

      if (transactionData.status !== 'pending') {
        throw new Error('Only pending transactions can be submitted');
      }

      if (!transactionData.fromReceipt) {
        throw new Error('Please upload payment receipt before submitting transfer');
      }

      const updateData: any = {
        status: 'processing',
        updatedAt: serverTimestamp(),
      };

      await updateDoc(transactionRef, updateData);

      const userDoc = await getDoc(doc(db, 'users', transactionData.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const isFirstTransaction = userData.hasCompletedFirstTransaction === false;
        
        if (isFirstTransaction && userData.referredBy) {
          try {
            await updateDoc(doc(db, 'users', transactionData.userId), {
              adamPoints: (userData.adamPoints || 0) + 500,
              hasCompletedFirstTransaction: true,
              updatedAt: serverTimestamp(),
            });

            const referrerDoc = await getDoc(doc(db, 'users', userData.referredBy));
            if (referrerDoc.exists()) {
              const referrerData = referrerDoc.data();
              const referralCount = referrerData.referrals?.length || 0;
              if (referralCount <= 20) {
                await updateDoc(doc(db, 'users', userData.referredBy), {
                  adamPoints: (referrerData.adamPoints || 0) + 500,
                  updatedAt: serverTimestamp(),
                });
              }
            }
          } catch (error) {
            console.error('Error awarding referral points:', error);
          }
        } else if (useAdamPoints) {
          const pointsToDeduct = transactionData.discountAmount;
          const newAdamPoints = Math.max(0, (userData.adamPoints || 0) - pointsToDeduct);
          
          await updateDoc(doc(db, 'users', transactionData.userId), {
            adamPoints: newAdamPoints,
            hasCompletedFirstTransaction: true,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'users', transactionData.userId), {
            hasCompletedFirstTransaction: true,
            updatedAt: serverTimestamp(),
          });
        }

        await notificationService.sendTransactionNotification({
          transactionId,
          userId: transactionData.userId,
          userEmail: userData.email,
          userName: userData.name || 'User',
          title: 'Transfer Submitted',
          body: `Your transfer of ${transactionData.totalfromAmount || transactionData.fromAmount} ${transactionData.fromCurrency} has been submitted and is being processed.`,
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

      const docRef = await addDoc(collection(db, 'recipients'), recipientData);

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

  updateRecipient: async (
    recipientId: string,
    data: Partial<SavedRecipient>
  ): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      const recipientRef = doc(db, 'recipients', recipientId);
      await updateDoc(recipientRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

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

  deleteRecipient: async (recipientId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      const recipientRef = doc(db, 'recipients', recipientId);
      await deleteDoc(recipientRef);

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

  setDefaultRecipient: async (recipientId: string, userId: string): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, recipient: true },
      error: { ...state.error, recipient: null },
    }));

    try {
      const q = query(
        collection(db, 'recipients'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map((document) =>
        updateDoc(doc(db, 'recipients', document.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);

      const recipientRef = doc(db, 'recipients', recipientId);
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

  updateProfile: async (userId: string, data: UpdateUserPayload): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, settings: true },
      error: { ...state.error, settings: null },
    }));

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

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

  uploadProfilePicture: async (userId: string, file: File): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, upload: true },
      error: { ...state.error, upload: null },
      uploadProgress: 0,
    }));

    try {
      if (!validateFileSize(file.size, 5)) {
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only images (JPEG, PNG, WebP) are allowed');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentProfilePicture = userDoc.data().profilePicture;
        if (currentProfilePicture) {
          try {
            await deleteFile(currentProfilePicture);
          } catch (error) {
            console.error('Error deleting old profile picture:', error);
          }
        }
      }

      const uniqueFileName = generateUniqueFileName(file.name);
      const storagePath = `users/${userId}/profile/${uniqueFileName}`;
      
      const downloadURL = await uploadFile(file, storagePath, (progress) => {
        set({ uploadProgress: progress });
      });

      await updateDoc(userRef, {
        profilePicture: downloadURL.url,
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

      await deleteFile(profilePictureUrl);

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
  
  sendContact: async (data: ContactPayload): Promise<ActionResult> => {
    set(state => ({
      loading: { ...state.loading, contact: true },
      error: { ...state.error, contact: null },
    }))
    try {
      await notificationService.sendAdminsCustom({
        title: 'Contact Form Submission',
        body: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
        subject: 'Contact Form Submission',
      });

      set(state => ({
        loading: { ...state.loading, contact: false },
      }))

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send contact message';
      set(state => ({
        loading: { ...state.loading, contact: false },
        error: { ...state.error, contact: errorMessage },
      }))
      return { success: false, error: errorMessage };
    }
  },

  sendNewsLetter: async (email: string): Promise<ActionResult> => {
    try {
      set(state => ({
        loading: { ...state.loading, newsletter: true },
        error: { ...state.error, newsletter: null },
      }))
      await notificationService.sendAdminsCustom({
        title: 'Newsletter Subscription',
        body: `Email: ${email}`,
        subject: 'Newsletter Subscription',
      });

      set(state => ({
        loading: { ...state.loading, newsletter: false },
      }))
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to subscribe to newsletter';
      set(state => ({
        loading: { ...state.loading, newsletter: false },
        error: { ...state.error, newsletter: errorMessage },
      }))
      return { success: false, error: errorMessage };
    }
  },

  clearErrors: () => set({
    error: {
      transfer: null,
      recipient: null,
      settings: null,
      upload: null,
      contact: null,
      newsLetter: null,
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

  clearContactError: () => set(state => ({
    error: { ...state.error, contact: null },
  })),

  clearNewsLetterError: () => set(state => ({
    error: { ...state.error, newsletter: null },
  })),
}));

export default useActions;