// hooks/admin/useAdminSettings.ts
import { create } from 'zustand';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminSettings, ActionResult } from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';

interface AdminSettingsStore {
  // State
  settings: AdminSettings | null;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<AdminSettings>) => Promise<ActionResult>;
  initializeSettings: () => Promise<ActionResult>;
  clearError: () => void;
}

const DEFAULT_SETTINGS: Omit<AdminSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  siteEmail: 'admin@example.com',
  sitePhone: '+1234567890',
  
  // Transaction settings
  transactionExpiryMinutes: 30,
  
  // Notification settings
  emailNotifications: true,
  pushNotifications: true,
  
  // Social links
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
  },
};

const useAdminSettings = create<AdminSettingsStore>((set, get) => ({
  // Initial State
  settings: null,
  loading: false,
  error: null,

  // Fetch settings
  fetchSettings: async () => {
    set({ loading: true, error: null });

    try {
      // Try to get the main settings document
      const settingsDoc = await getDoc(doc(db, 'settings', 'main'));

      if (settingsDoc.exists()) {
        const settings = {
          id: settingsDoc.id,
          ...settingsDoc.data(),
          createdAt: formatFirestoreTimestamp(settingsDoc.data().createdAt),
          updatedAt: formatFirestoreTimestamp(settingsDoc.data().updatedAt),
        } as AdminSettings;

        set({ settings, loading: false });
      } else {
        // If settings don't exist, initialize with defaults
        await get().initializeSettings();
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch settings',
      });
    }
  },

  // Update settings
  updateSettings: async (data: Partial<AdminSettings>): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const settingsRef = doc(db, 'settings', 'main');
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

      await updateDoc(settingsRef, updateData);

      set(state => ({
        settings: state.settings
          ? { ...state.settings, ...data, updatedAt: new Date().toISOString() }
          : null,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update settings';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Initialize settings with defaults
  initializeSettings: async (): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const settingsRef = doc(db, 'settings', 'main');
      
      const newSettings = {
        ...DEFAULT_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(settingsRef, newSettings);

      const settings: AdminSettings = {
        id: 'main',
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({ settings, loading: false });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize settings';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Utility actions
  clearError: () => set({ error: null }),
}));

export default useAdminSettings;