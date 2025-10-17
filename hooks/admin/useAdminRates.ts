// hooks/admin/useAdminRates.ts
import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExchangeRate } from '@/types/exchange';
import { ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface AdminRatesStore {
  // State
  exchangeRates: ExchangeRate[];
  selectedRate: ExchangeRate | null;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchExchangeRates: () => Promise<void>;
  getRateById: (rateId: string) => Promise<ExchangeRate | null>;
  createExchangeRate: (data: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  updateExchangeRate: (rateId: string, data: Partial<ExchangeRate>) => Promise<ActionResult>;
  deleteExchangeRate: (rateId: string) => Promise<ActionResult>;
  toggleRateStatus: (rateId: string, enabled: boolean) => Promise<ActionResult>;
  setSelectedRate: (rate: ExchangeRate | null) => void;
  clearError: () => void;
}

const useAdminRates = create<AdminRatesStore>((set, get) => ({
  // Initial State
  exchangeRates: [],
  selectedRate: null,
  loading: false,
  error: null,

  // Fetch all exchange rates
  fetchExchangeRates: async () => {
    set({ loading: true, error: null });

    try {
      const ratesQuery = query(
        collection(db, 'exchangeRates'),
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

      set({ exchangeRates: rates, loading: false });
    } catch (error: any) {
      console.error('Error fetching exchange rates:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch exchange rates',
      });
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
      set({ error: error.message || 'Failed to get exchange rate' });
      return null;
    }
  },

  // Create exchange rate
  createExchangeRate: async (
    data: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const docRef = await addDoc(collection(db, 'exchangeRates'), {
        ...data,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newRate: ExchangeRate = {
        id: docRef.id,
        ...data,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set(state => ({
        exchangeRates: [newRate, ...state.exchangeRates],
        loading: false,
      }));

      return { success: true, data: { id: docRef.id } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create exchange rate';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Update exchange rate
  updateExchangeRate: async (
    rateId: string,
    data: Partial<ExchangeRate>
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const rateRef = doc(db, 'exchangeRates', rateId);
      const updateData = {
        ...data,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateDoc(rateRef, updateData);

      set(state => ({
        exchangeRates: state.exchangeRates.map(rate =>
          rate.id === rateId
            ? { ...rate, ...data, lastUpdated: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : rate
        ),
        selectedRate: state.selectedRate?.id === rateId
          ? { ...state.selectedRate, ...data, lastUpdated: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : state.selectedRate,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update exchange rate';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Delete exchange rate
  deleteExchangeRate: async (rateId: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      await deleteDoc(doc(db, 'exchangeRates', rateId));

      set(state => ({
        exchangeRates: state.exchangeRates.filter(r => r.id !== rateId),
        selectedRate: state.selectedRate?.id === rateId ? null : state.selectedRate,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete exchange rate';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Toggle rate status
  toggleRateStatus: async (rateId: string, enabled: boolean): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const rateRef = doc(db, 'exchangeRates', rateId);
      await updateDoc(rateRef, {
        enabled,
        updatedAt: serverTimestamp(),
      });

      set(state => ({
        exchangeRates: state.exchangeRates.map(rate =>
          rate.id === rateId
            ? { ...rate, enabled, updatedAt: new Date().toISOString() }
            : rate
        ),
        selectedRate: state.selectedRate?.id === rateId
          ? { ...state.selectedRate, enabled, updatedAt: new Date().toISOString() }
          : state.selectedRate,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to toggle rate status';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Utility actions
  setSelectedRate: (rate: ExchangeRate | null) => set({ selectedRate: rate }),
  clearError: () => set({ error: null }),
}));

export default useAdminRates;