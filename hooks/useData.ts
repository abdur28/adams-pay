// hooks/useData.ts
import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  User,
  SavedRecipient,
  ReferralData,
  TransactionFilters,
  PaginationState,
} from '@/types/type';
import { FirebaseTransaction, ExchangeRate } from '@/types/exchange';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface UseDataStore {
  // User Data
  user: User | null;
  
  // Transactions
  transactions: FirebaseTransaction[];
  transactionsPagination: PaginationState;
  
  // Recipients
  recipients: SavedRecipient[];
  defaultRecipient: SavedRecipient | null;
  
  // Referrals
  referrals: ReferralData[];
  referralStats: {
    totalReferrals: number;
    activeReferrals: number;
    totalAdamPoints: number;
  } | null;
  
  // Exchange Rates
  exchangeRates: ExchangeRate[];
  availablePairs: Array<{ from: string; to: string; rateId: string }>;

  // Loading States
  loading: {
    user: boolean;
    transactions: boolean;
    recipients: boolean;
    referrals: boolean;
    rates: boolean;
  };

  // Error States
  error: {
    user: string | null;
    transactions: string | null;
    recipients: string | null;
    referrals: string | null;
    rates: string | null;
  };

  // User Actions
  fetchUser: (userId: string) => Promise<void>;
  refreshUser: (userId: string) => Promise<void>;

  // Transaction Actions
  fetchTransactions: (userId: string, filters?: TransactionFilters, limitCount?: number, startAfterDoc?: DocumentSnapshot) => Promise<void>;
  getTransactionById: (transactionId: string) => Promise<FirebaseTransaction | null>;
  fetchUserTransactionStats: (userId: string) => Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }>;

  // Recipient Actions
  fetchRecipients: (userId: string) => Promise<void>;
  getRecipientById: (recipientId: string) => Promise<SavedRecipient | null>;
  refreshRecipients: (userId: string) => Promise<void>;

  // Referral Actions
  fetchReferrals: (userId: string) => Promise<void>;
  fetchReferralStats: (userId: string) => Promise<void>;

  // Exchange Rate Actions
  fetchExchangeRates: () => Promise<void>;
  getRateById: (rateId: string) => Promise<ExchangeRate | null>;
  getAvailableRates: (fromCurrency?: string, toCurrency?: string) => ExchangeRate[];
  refreshRates: () => Promise<void>;

  // Utility Actions
  clearErrors: () => void;
  clearUserError: () => void;
  clearTransactionsError: () => void;
  clearRecipientsError: () => void;
  clearReferralsError: () => void;
  clearRatesError: () => void;
  resetTransactions: () => void;
  resetRecipients: () => void;
  resetReferrals: () => void;
}

const useData = create<UseDataStore>((set, get) => ({
  // Initial State
  user: null,
  transactions: [],
  transactionsPagination: { lastDoc: null, hasMore: false },
  recipients: [],
  defaultRecipient: null,
  referrals: [],
  referralStats: null,
  exchangeRates: [],
  availablePairs: [],

  loading: {
    user: false,
    transactions: false,
    recipients: false,
    referrals: false,
    rates: false,
  },

  error: {
    user: null,
    transactions: null,
    recipients: null,
    referrals: null,
    rates: null,
  },

  // ==================== USER ACTIONS ====================

  // Fetch user
  fetchUser: async (userId: string) => {
    set(state => ({
      loading: { ...state.loading, user: true },
      error: { ...state.error, user: null },
    }));

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const user: User = {
        id: userDoc.id,
        ...userDoc.data(),
        addedAt: formatFirestoreTimestamp(userDoc.data().addedAt),
        updatedAt: formatFirestoreTimestamp(userDoc.data().updatedAt),
        lastLoginAt: formatFirestoreTimestamp(userDoc.data().lastLoginAt),
      } as User;

      set(state => ({
        user,
        loading: { ...state.loading, user: false },
      }));
    } catch (error: any) {
      console.error('Error fetching user:', error);
      set(state => ({
        loading: { ...state.loading, user: false },
        error: { ...state.error, user: error.message || 'Failed to fetch user' },
      }));
    }
  },

  // Refresh user data
  refreshUser: async (userId: string) => {
    await get().fetchUser(userId);
  },

  // ==================== TRANSACTION ACTIONS ====================

  // Fetch transactions
  fetchTransactions: async (
    userId: string,
    filters?: TransactionFilters,
    limitCount = 20,
    startAfterDoc?: DocumentSnapshot
  ) => {
    set(state => ({
      loading: { ...state.loading, transactions: true },
      error: { ...state.error, transactions: null },
    }));

    try {
      // Build query
      let baseQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );

      // Apply filters
      if (filters?.status) {
        baseQuery = query(baseQuery, where('status', '==', filters.status));
      }

      if (filters?.type) {
        baseQuery = query(baseQuery, where('type', '==', filters.type));
      }

      if (filters?.dateFrom) {
        baseQuery = query(baseQuery, where('createdAt', '>=', new Date(filters.dateFrom)));
      }

      if (filters?.dateTo) {
        baseQuery = query(baseQuery, where('createdAt', '<=', new Date(filters.dateTo)));
      }

      // Apply ordering
      let orderedQuery = query(baseQuery, orderBy('createdAt', 'desc'));

      // Apply pagination
      let paginatedQuery;
      if (startAfterDoc || get().transactionsPagination.lastDoc) {
        const lastDoc = startAfterDoc || get().transactionsPagination.lastDoc;
        paginatedQuery = query(orderedQuery, startAfter(lastDoc), limit(limitCount));
      } else {
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

      set(state => ({
        transactions: startAfterDoc ? [...state.transactions, ...transactions] : transactions,
        transactionsPagination: {
          lastDoc: lastVisible,
          hasMore: snapshot.docs.length === limitCount,
        },
        loading: { ...state.loading, transactions: false },
      }));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      set(state => ({
        loading: { ...state.loading, transactions: false },
        error: { ...state.error, transactions: error.message || 'Failed to fetch transactions' },
      }));
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
      set(state => ({
        error: { ...state.error, transactions: error.message || 'Failed to get transaction' },
      }));
      return null;
    }
  },

  // Fetch user transaction stats
  fetchUserTransactionStats: async (userId: string) => {
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(transactionsQuery);

      const stats = {
        total: snapshot.size,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data().status;
        if (status === 'pending') stats.pending++;
        else if (status === 'processing') stats.processing++;
        else if (status === 'completed') stats.completed++;
        else if (status === 'failed') stats.failed++;
        else if (status === 'cancelled') stats.cancelled++;
      });

      return stats;
    } catch (error: any) {
      console.error('Error fetching transaction stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      };
    }
  },

  // ==================== RECIPIENT ACTIONS ====================

  // Fetch recipients
  fetchRecipients: async (userId: string) => {
    set(state => ({
      loading: { ...state.loading, recipients: true },
      error: { ...state.error, recipients: null },
    }));

    try {
      const recipientsQuery = query(
        collection(db, 'savedRecipients'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(recipientsQuery);

      const recipients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
      } as SavedRecipient));

      const defaultRecipient = recipients.find(r => r.isDefault) || null;

      set(state => ({
        recipients,
        defaultRecipient,
        loading: { ...state.loading, recipients: false },
      }));
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      set(state => ({
        loading: { ...state.loading, recipients: false },
        error: { ...state.error, recipients: error.message || 'Failed to fetch recipients' },
      }));
    }
  },

  // Get recipient by ID
  getRecipientById: async (recipientId: string): Promise<SavedRecipient | null> => {
    try {
      const recipientDoc = await getDoc(doc(db, 'savedRecipients', recipientId));

      if (!recipientDoc.exists()) return null;

      return {
        id: recipientDoc.id,
        ...recipientDoc.data(),
        createdAt: formatFirestoreTimestamp(recipientDoc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(recipientDoc.data().updatedAt),
      } as SavedRecipient;
    } catch (error: any) {
      console.error('Error getting recipient:', error);
      set(state => ({
        error: { ...state.error, recipients: error.message || 'Failed to get recipient' },
      }));
      return null;
    }
  },

  // Refresh recipients
  refreshRecipients: async (userId: string) => {
    await get().fetchRecipients(userId);
  },

  // ==================== REFERRAL ACTIONS ====================

  // Fetch referrals
  fetchReferrals: async (userId: string) => {
    set(state => ({
      loading: { ...state.loading, referrals: true },
      error: { ...state.error, referrals: null },
    }));

    try {
      // Get user document to get referral list
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const referralIds = userDoc.data().referrals || [];

      if (referralIds.length === 0) {
        set(state => ({
          referrals: [],
          loading: { ...state.loading, referrals: false },
        }));
        return;
      }

      // Fetch referred users' data
      const referralsQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', referralIds)
      );

      const snapshot = await getDocs(referralsQuery);

      const referrals: ReferralData[] = snapshot.docs.map(doc => ({
        userId: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        status: doc.data().status,
        joinedAt: formatFirestoreTimestamp(doc.data().addedAt),
        adamPoints: doc.data().adamPoints || 0,
      }));

      set(state => ({
        referrals,
        loading: { ...state.loading, referrals: false },
      }));
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      set(state => ({
        loading: { ...state.loading, referrals: false },
        error: { ...state.error, referrals: error.message || 'Failed to fetch referrals' },
      }));
    }
  },

  // Fetch referral stats
  fetchReferralStats: async (userId: string) => {
    set(state => ({
      loading: { ...state.loading, referrals: true },
      error: { ...state.error, referrals: null },
    }));

    try {
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const referralIds = userDoc.data().referrals || [];
      const totalReferrals = referralIds.length;

      if (totalReferrals === 0) {
        set(state => ({
          referralStats: {
            totalReferrals: 0,
            activeReferrals: 0,
            totalAdamPoints: 0,
          },
          loading: { ...state.loading, referrals: false },
        }));
        return;
      }

      // Fetch referred users' data for stats
      const referralsQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', referralIds)
      );

      const snapshot = await getDocs(referralsQuery);

      let activeReferrals = 0;
      let totalAdamPoints = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          activeReferrals++;
        }
        totalAdamPoints += data.adamPoints || 0;
      });

      set(state => ({
        referralStats: {
          totalReferrals,
          activeReferrals,
          totalAdamPoints,
        },
        loading: { ...state.loading, referrals: false },
      }));
    } catch (error: any) {
      console.error('Error fetching referral stats:', error);
      set(state => ({
        loading: { ...state.loading, referrals: false },
        error: { ...state.error, referrals: error.message || 'Failed to fetch referral stats' },
      }));
    }
  },

  // ==================== EXCHANGE RATE ACTIONS ====================

  // Fetch exchange rates
  fetchExchangeRates: async () => {
    set(state => ({
      loading: { ...state.loading, rates: true },
      error: { ...state.error, rates: null },
    }));

    try {
      const ratesQuery = query(
        collection(db, 'exchangeRates'),
        where('enabled', '==', true),
        orderBy('lastUpdated', 'desc')
      );

      const snapshot = await getDocs(ratesQuery);

      const rates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: formatFirestoreTimestamp(doc.data().lastUpdated),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
      } as ExchangeRate));

      // Build available pairs
      const availablePairs = rates.map(rate => ({
        from: rate.fromCurrency,
        to: rate.toCurrency,
        rateId: rate.id,
      }));

      set(state => ({
        exchangeRates: rates,
        availablePairs,
        loading: { ...state.loading, rates: false },
      }));
    } catch (error: any) {
      console.error('Error fetching exchange rates:', error);
      set(state => ({
        loading: { ...state.loading, rates: false },
        error: { ...state.error, rates: error.message || 'Failed to fetch exchange rates' },
      }));
    }
  },

  // Get rate by ID
  getRateById: async (rateId: string): Promise<ExchangeRate | null> => {
    try {
      const rateDoc = await getDoc(doc(db, 'exchangeRates', rateId));

      if (!rateDoc.exists()) return null;

      return {
        id: rateDoc.id,
        ...rateDoc.data(),
        lastUpdated: formatFirestoreTimestamp(rateDoc.data().lastUpdated),
        createdAt: formatFirestoreTimestamp(rateDoc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(rateDoc.data().updatedAt),
      } as ExchangeRate;
    } catch (error: any) {
      console.error('Error getting exchange rate:', error);
      set(state => ({
        error: { ...state.error, rates: error.message || 'Failed to get exchange rate' },
      }));
      return null;
    }
  },

  // Get available rates with optional filtering
  getAvailableRates: (fromCurrency?: string, toCurrency?: string): ExchangeRate[] => {
    const { exchangeRates } = get();

    let filteredRates = exchangeRates;

    if (fromCurrency) {
      filteredRates = filteredRates.filter(rate => rate.fromCurrency === fromCurrency);
    }

    if (toCurrency) {
      filteredRates = filteredRates.filter(rate => rate.toCurrency === toCurrency);
    }

    return filteredRates;
  },

  // Refresh rates
  refreshRates: async () => {
    await get().fetchExchangeRates();
  },

  // ==================== UTILITY ACTIONS ====================

  clearErrors: () => set({
    error: {
      user: null,
      transactions: null,
      recipients: null,
      referrals: null,
      rates: null,
    },
  }),

  clearUserError: () => set(state => ({
    error: { ...state.error, user: null },
  })),

  clearTransactionsError: () => set(state => ({
    error: { ...state.error, transactions: null },
  })),

  clearRecipientsError: () => set(state => ({
    error: { ...state.error, recipients: null },
  })),

  clearReferralsError: () => set(state => ({
    error: { ...state.error, referrals: null },
  })),

  clearRatesError: () => set(state => ({
    error: { ...state.error, rates: null },
  })),

  resetTransactions: () => set({
    transactions: [],
    transactionsPagination: { lastDoc: null, hasMore: false },
  }),

  resetRecipients: () => set({
    recipients: [],
    defaultRecipient: null,
  }),

  resetReferrals: () => set({
    referrals: [],
    referralStats: null,
  }),
}));

export default useData;