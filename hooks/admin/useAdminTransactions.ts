// hooks/admin/useAdminTransactions.ts

import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirebaseTransaction } from '@/types/exchange';
import { FetchOptions, PaginationState, ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';
import {
  uploadFile,
  deleteFile,
  generateUniqueFileName,
  validateFileSize
} from '@/lib/storage';
import notificationService from '@/lib/notificationService';
import auditLogger from '@/lib/auditLog';

interface TransactionStats {
  total: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface AdminTransactionsStore {
  // State
  transactions: FirebaseTransaction[];
  selectedTransaction: FirebaseTransaction | null;
  stats: TransactionStats;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Actions
  fetchTransactions: (options?: FetchOptions) => Promise<void>;
  fetchTransactionStats: () => Promise<void>;
  getTransactionById: (transactionId: string) => Promise<FirebaseTransaction | null>;
  updateTransactionStatus: (transactionId: string, status: FirebaseTransaction['status'], notes?: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  approveTransaction: (transactionId: string, notes?: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  rejectTransaction: (transactionId: string, reason: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  cancelTransaction: (transactionId: string, reason?: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  refundTransaction: (transactionId: string, reason?: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  markTransactionAsComplete: (transactionId: string, notes?: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  addTransactionNote: (transactionId: string, note: string, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  uploadTransactionReceipt: (transactionId: string, file: File, receiptType: 'fromReceipt' | 'toReceipt', onProgress?: (progress: number) => void, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  deleteTransactionReceipt: (transactionId: string, receiptType: 'fromReceipt' | 'toReceipt', adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  bulkUpdateTransactionStatus: (transactionIds: string[], status: FirebaseTransaction['status'], adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  setSelectedTransaction: (transaction: FirebaseTransaction | null) => void;
  resetTransactions: () => void;
  clearError: () => void;
}

// Helper to get notification content based on status
function getNotificationContent(status: FirebaseTransaction['status'], transactionData: any) {
  const amount = `${transactionData.fromAmount} ${transactionData.fromCurrency}`;
  const recipient = transactionData.recipientDetails?.fullName || 'recipient';

  switch (status) {
    case 'pending':
      return {
        title: 'Transfer Initiated',
        body: `Your transfer of ${amount} to ${recipient} is pending verification.`,
      };
    case 'processing':
      return {
        title: 'Transfer Processing',
        body: `Your transfer of ${amount} to ${recipient} is being processed.`,
      };
    case 'completed':
      return {
        title: 'Transfer Completed',
        body: `Your transfer of ${amount} to ${recipient} has been completed successfully!`,
      };
    case 'failed':
      return {
        title: 'Transfer Failed',
        body: `Your transfer of ${amount} to ${recipient} has failed. Please contact support.`,
      };
    case 'cancelled':
      return {
        title: 'Transfer Cancelled',
        body: `Your transfer of ${amount} to ${recipient} has been cancelled.`,
      };
    default:
      return null;
  }
}

// Helper to send notifications
async function sendTransactionStatusNotification(
  transactionId: string,
  status: FirebaseTransaction['status'],
  transactionData: any
) {
  try {
    const notificationContent = getNotificationContent(status, transactionData);
    if (!notificationContent) return;

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', transactionData.userId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    // Send notification
    await notificationService.sendTransactionNotification({
      transactionId,
      userId: transactionData.userId,
      userEmail: userData.email,
      userName: userData.name || userData.fullName || 'User',
      title: notificationContent.title,
      body: notificationContent.body,
      transactionData,
      notifyUser: true,
      notifyAdmins: status === 'processing', // Only notify admins when processing
    });
  } catch (error) {
    console.error('Error sending transaction notification:', error);
  }
}

const useAdminTransactions = create<AdminTransactionsStore>((set, get) => ({
  // Initial State
  transactions: [],
  selectedTransaction: null,
  stats: { total: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
  loading: false,
  error: null,
  pagination: {
    lastDoc: null,
    hasMore: false,
  },

  // Fetch aggregate stats (true totals from Firestore)
  fetchTransactionStats: async () => {
    try {
      const txnCol = collection(db, 'transactions');
      const [totalSnap, processingSnap, completedSnap, failedSnap, cancelledSnap] = await Promise.all([
        getCountFromServer(query(txnCol, where('status', '!=', 'pending'))),
        getCountFromServer(query(txnCol, where('status', '==', 'processing'))),
        getCountFromServer(query(txnCol, where('status', '==', 'completed'))),
        getCountFromServer(query(txnCol, where('status', '==', 'failed'))),
        getCountFromServer(query(txnCol, where('status', '==', 'cancelled'))),
      ]);
      set({
        stats: {
          total: totalSnap.data().count,
          processing: processingSnap.data().count,
          completed: completedSnap.data().count,
          failed: failedSnap.data().count,
          cancelled: cancelledSnap.data().count,
        },
      });
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  },

  // Fetch transactions with pagination and filters
  fetchTransactions: async (options: FetchOptions = {}) => {
    set({ loading: true, error: null });

    try {
      const {
        limit: limitCount = 20,
        startAfter: startAfterDoc,
        filters = [],
        orderByField = 'createdAt',
        orderDirection = 'desc',
      } = options;

      // Build query
      let baseQuery = query(collection(db, 'transactions'));

      // Apply filters
      filters.forEach(filter => {
        baseQuery = query(baseQuery, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      let orderedQuery = query(baseQuery, orderBy(orderByField, orderDirection));

      // Apply pagination - only paginate when startAfter is explicitly provided
      let paginatedQuery;
      if (startAfterDoc) {
        paginatedQuery = query(orderedQuery, startAfter(startAfterDoc), limit(limitCount));
      } else {
        // Fresh fetch - reset pagination state
        paginatedQuery = query(orderedQuery, limit(limitCount));
      }

      const snapshot = await getDocs(paginatedQuery);

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
        completedAt: formatFirestoreTimestamp(doc.data().completedAt),
        cancelledAt: formatFirestoreTimestamp(doc.data().cancelledAt),
      } as FirebaseTransaction));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      set({
        transactions: options.startAfter ? [...get().transactions, ...transactions] : transactions,
        loading: false,
        pagination: {
          lastDoc: lastVisible,
          hasMore: snapshot.docs.length === limitCount,
        },
      });
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch transactions',
      });
    }
  },

  // Get transaction by ID
  getTransactionById: async (transactionId: string): Promise<FirebaseTransaction | null> => {
    try {
      const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));

      if (!transactionDoc.exists()) return null;

      return {
        id: transactionDoc.id,
        ...transactionDoc.data(),
        createdAt: formatFirestoreTimestamp(transactionDoc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(transactionDoc.data().updatedAt),
        completedAt: formatFirestoreTimestamp(transactionDoc.data().completedAt),
        cancelledAt: formatFirestoreTimestamp(transactionDoc.data().cancelledAt),
      } as FirebaseTransaction;
    } catch (error: any) {
      console.error('Error getting transaction:', error);
      set({ error: error.message || 'Failed to get transaction' });
      return null;
    }
  },

  // Update transaction status
  updateTransactionStatus: async (
    transactionId: string,
    status: FirebaseTransaction['status'],
    notes?: string,
    adminId?: string,
    adminEmail?: string
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();
      const previousStatus = transactionData.status;

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }

      if (notes) {
        updateData.adminNotes = notes;
      }

      await updateDoc(transactionRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_STATUS_UPDATE', transactionId, {
          previousStatus,
          newStatus: status,
          notes,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, status, {
        ...transactionData,
        status,
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, status, updatedAt: new Date().toISOString() } : t
        ),
        selectedTransaction: state.selectedTransaction?.id === transactionId
          ? { ...state.selectedTransaction, status, updatedAt: new Date().toISOString() }
          : state.selectedTransaction,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update transaction status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Approve transaction
  approveTransaction: async (transactionId: string, notes?: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      const updateData: any = {
        status: 'processing',
        updatedAt: serverTimestamp(),
      };

      if (notes) {
        updateData.adminNotes = notes;
      }

      await updateDoc(transactionRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_APPROVE', transactionId, {
          previousStatus: transactionData.status,
          notes,
          amount: transactionData.fromAmount,
          currency: transactionData.fromCurrency,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, 'processing', {
        ...transactionData,
        status: 'processing',
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, status: 'processing', updatedAt: new Date().toISOString() } : t
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to approve transaction';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Reject transaction
  rejectTransaction: async (transactionId: string, reason: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      await updateDoc(transactionRef, {
        status: 'failed',
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_REJECT', transactionId, {
          previousStatus: transactionData.status,
          reason,
          amount: transactionData.fromAmount,
          currency: transactionData.fromCurrency,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, 'failed', {
        ...transactionData,
        status: 'failed',
        rejectionReason: reason,
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, status: 'failed', updatedAt: new Date().toISOString() } : t
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reject transaction';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Cancel transaction
  cancelTransaction: async (transactionId: string, reason?: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      const updateData: any = {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (reason) {
        updateData.cancellationReason = reason;
      }

      await updateDoc(transactionRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_CANCEL', transactionId, {
          previousStatus: transactionData.status,
          reason,
          amount: transactionData.fromAmount,
          currency: transactionData.fromCurrency,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, 'cancelled', {
        ...transactionData,
        status: 'cancelled',
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, status: 'cancelled', updatedAt: new Date().toISOString() } : t
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel transaction';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Refund transaction
  refundTransaction: async (transactionId: string, reason?: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      const updateData: any = {
        status: 'cancelled',
        refunded: true,
        refundedAt: serverTimestamp(),
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (reason) {
        updateData.refundReason = reason;
      }

      await updateDoc(transactionRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_REFUND', transactionId, {
          previousStatus: transactionData.status,
          reason,
          amount: transactionData.fromAmount,
          currency: transactionData.fromCurrency,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, 'cancelled', {
        ...transactionData,
        status: 'cancelled',
        refunded: true,
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId
            ? { ...t, status: 'cancelled', refunded: true, updatedAt: new Date().toISOString() }
            : t
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to refund transaction';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Mark transaction as complete
  markTransactionAsComplete: async (transactionId: string, notes?: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);

      // Get current transaction data
      const transactionDoc = await getDoc(transactionRef);
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data();

      const updateData: any = {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (notes) {
        updateData.completionNotes = notes;
      }

      await updateDoc(transactionRef, updateData);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_COMPLETE', transactionId, {
          previousStatus: transactionData.status,
          notes,
          amount: transactionData.fromAmount,
          currency: transactionData.fromCurrency,
        }, adminEmail);
      }

      // Send notifications
      await sendTransactionStatusNotification(transactionId, 'completed', {
        ...transactionData,
        status: 'completed',
      });

      set(state => ({
        transactions: state.transactions.map(t =>
          t.id === transactionId ? { ...t, status: 'completed', updatedAt: new Date().toISOString() } : t
        ),
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to mark transaction as complete';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Add transaction note
  addTransactionNote: async (transactionId: string, note: string, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const existingData = transactionDoc.data();
      const existingNotes = existingData.adminNotes || '';
      const timestamp = new Date().toISOString();

      const newNote = `[${timestamp}] Admin: ${note}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

      await updateDoc(transactionRef, {
        adminNotes: updatedNotes,
        updatedAt: serverTimestamp(),
      });

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_NOTE_ADD', transactionId, {
          note,
        }, adminEmail);
      }

      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add transaction note';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Upload transaction receipt
  uploadTransactionReceipt: async (
    transactionId: string,
    file: File,
    receiptType: 'fromReceipt' | 'toReceipt',
    onProgress?: (progress: number) => void,
    adminId?: string,
    adminEmail?: string
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

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
      const downloadURL = await uploadFile(file, storagePath, onProgress);

      // Prepare receipt metadata
      const receiptData = {
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

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_RECEIPT_UPLOAD', transactionId, {
          receiptType,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }, adminEmail);
      }

      set({ loading: false });
      return { success: true, data: { receiptData } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload receipt';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Delete transaction receipt
  deleteTransactionReceipt: async (
    transactionId: string,
    receiptType: 'fromReceipt' | 'toReceipt',
    adminId?: string,
    adminEmail?: string
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

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

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_RECEIPT_DELETE', transactionId, {
          receiptType,
          deletedFileName: receiptData.name,
        }, adminEmail);
      }

      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete receipt';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Bulk update transaction status
  bulkUpdateTransactionStatus: async (
    transactionIds: string[],
    status: FirebaseTransaction['status'],
    adminId?: string,
    adminEmail?: string
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const updatePromises = transactionIds.map(async (transactionId) => {
        const transactionRef = doc(db, 'transactions', transactionId);

        // Get transaction data for notifications
        const transactionDoc = await getDoc(transactionRef);
        const transactionData = transactionDoc.exists() ? transactionDoc.data() : null;

        const updateData: any = {
          status,
          updatedAt: serverTimestamp(),
        };

        if (status === 'completed') {
          updateData.completedAt = serverTimestamp();
        } else if (status === 'cancelled') {
          updateData.cancelledAt = serverTimestamp();
        }

        await updateDoc(transactionRef, updateData);

        // Send notification for each transaction
        if (transactionData) {
          await sendTransactionStatusNotification(transactionId, status, {
            ...transactionData,
            status,
          });
        }
      });

      await Promise.all(updatePromises);

      // Audit log
      if (adminId) {
        await auditLogger.logTransactionAction(adminId, 'TRANSACTION_BULK_STATUS_UPDATE', transactionIds.join(','), {
          transactionIds,
          newStatus: status,
          affectedCount: transactionIds.length,
        }, adminEmail);
      }

      set(state => ({
        transactions: state.transactions.map(t =>
          transactionIds.includes(t.id)
            ? { ...t, status, updatedAt: new Date().toISOString() }
            : t
        ),
        loading: false,
      }));

      return { success: true, data: { updatedCount: transactionIds.length } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to bulk update transaction status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Utility actions
  setSelectedTransaction: (transaction: FirebaseTransaction | null) => 
    set({ selectedTransaction: transaction }),
  resetTransactions: () => 
    set({ transactions: [], pagination: { lastDoc: null, hasMore: false } }),
  clearError: () => set({ error: null }),
}));

export default useAdminTransactions;