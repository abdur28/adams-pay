// hooks/admin/useAdmin.ts

import { create } from 'zustand';
import { AdminStore } from '@/types/admin';
import useAdminUsers from './useAdminUsers';
import useAdminTransactions from './useAdminTransactions';
import useAdminRates from './useAdminRates';
import useAdminBulkEmail from './useAdminBulkEmail';
import useAdminSettings from './useAdminSettings';
import useAdminTestimonials from './useAdminTestimonials';

/**
 * Main admin hook that combines all specialized admin hooks
 * This provides a single entry point for accessing all admin functionality
 */
const useAdmin = create<AdminStore>((set, get) => {
  // Set up subscriptions to update the main store when sub-stores change
  useAdminUsers.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      users: state.users,
      loading: { ...currentState.loading, users: state.loading },
      error: { ...currentState.error, users: state.error },
      pagination: { ...currentState.pagination, users: state.pagination },
    }));
  });

  useAdminTransactions.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      transactions: state.transactions,
      loading: { ...currentState.loading, transactions: state.loading },
      error: { ...currentState.error, transactions: state.error },
      pagination: { ...currentState.pagination, transactions: state.pagination },
    }));
  });

  useAdminRates.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      exchangeRates: state.exchangeRates,
      selectedRate: state.selectedRate,
      loading: { ...currentState.loading, rates: state.loading },
      error: { ...currentState.error, rates: state.error },
    }));
  });

  useAdminBulkEmail.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      emailTemplates: state.emailTemplates,
      emailHistory: state.emailHistory,
      loading: { ...currentState.loading, bulkEmail: state.loading },
      error: { ...currentState.error, bulkEmail: state.error },
      pagination: { ...currentState.pagination, emailHistory: state.pagination },
    }));
  });

  useAdminSettings.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      settings: state.settings,
      loading: { ...currentState.loading, settings: state.loading },
      error: { ...currentState.error, settings: state.error },
    }));
  });

  useAdminTestimonials.subscribe((state) => {
    set((currentState) => ({
      ...currentState,
      testimonials: state.testimonials,
      selectedTestimonial: state.selectedTestimonial,
      loading: { ...currentState.loading, testimonials: state.loading },
      error: { ...currentState.error, testimonials: state.error },
    }));
  });

  // Get initial state from all sub-stores
  const usersState = useAdminUsers.getState();
  const transactionsState = useAdminTransactions.getState();
  const ratesState = useAdminRates.getState();
  const bulkEmailState = useAdminBulkEmail.getState();
  const settingsState = useAdminSettings.getState();
  const testimonialsState = useAdminTestimonials.getState();

  // Global reset errors function
  const resetErrors = () => {
    useAdminUsers.setState({ error: null });
    useAdminTransactions.setState({ error: null });
    useAdminRates.setState({ error: null });
    useAdminBulkEmail.setState({ error: null });
    useAdminSettings.setState({ error: null });
    useAdminTestimonials.setState({ error: null });
  };

  // Individual error clear functions
  const clearUserError = () => useAdminUsers.setState({ error: null });
  const clearTransactionError = () => useAdminTransactions.setState({ error: null });
  const clearRatesError = () => useAdminRates.setState({ error: null });
  const clearBulkEmailError = () => useAdminBulkEmail.setState({ error: null });
  const clearSettingsError = () => useAdminSettings.setState({ error: null });
  const clearTestimonialsError = () => useAdminTestimonials.setState({ error: null });

  // Reset data functions
  const resetUsers = () => useAdminUsers.getState().resetUsers();
  const resetTransactions = () => useAdminTransactions.getState().resetTransactions();

  // Create the combined store
  return {
    // State properties
    users: usersState.users,
    selectedUser: null,
    transactions: transactionsState.transactions,
    selectedTransaction: null,
    exchangeRates: ratesState.exchangeRates,
    selectedRate: ratesState.selectedRate,
    settings: settingsState.settings,
    emailTemplates: bulkEmailState.emailTemplates,
    emailHistory: bulkEmailState.emailHistory,
    testimonials: testimonialsState.testimonials,
    selectedTestimonial: testimonialsState.selectedTestimonial,

    // Combined loading state
    loading: {
      users: usersState.loading,
      transactions: transactionsState.loading,
      rates: ratesState.loading,
      settings: settingsState.loading,
      bulkEmail: bulkEmailState.loading,
      testimonials: testimonialsState.loading,
      adminAction: false,
    },

    // Combined error state
    error: {
      users: usersState.error,
      transactions: transactionsState.error,
      rates: ratesState.error,
      settings: settingsState.error,
      bulkEmail: bulkEmailState.error,
      testimonials: testimonialsState.error,
      adminAction: null,
    },

    // Combined pagination state
    pagination: {
      users: usersState.pagination,
      transactions: transactionsState.pagination,
      emailHistory: bulkEmailState.pagination,
    },

    // User Management Methods - proxy to sub-store with state sync
    fetchUsers: async (options) => {
      const result = await useAdminUsers.getState().fetchUsers(options);
      set((state) => ({
        ...state,
        users: useAdminUsers.getState().users,
        loading: { ...state.loading, users: useAdminUsers.getState().loading },
        error: { ...state.error, users: useAdminUsers.getState().error },
        pagination: { ...state.pagination, users: useAdminUsers.getState().pagination },
      }));
      return result;
    },

    getUserById: async (userId) => {
      return await useAdminUsers.getState().getUserById(userId);
    },

    updateUser: async (userId, data) => {
      const result = await useAdminUsers.getState().updateUser(userId, data);
      set((state) => ({
        ...state,
        users: useAdminUsers.getState().users,
        selectedUser: useAdminUsers.getState().selectedUser,
      }));
      return result;
    },

    toggleUserStatus: async (userId, status) => {
      const result = await useAdminUsers.getState().toggleUserStatus(userId, status);
      set((state) => ({
        ...state,
        users: useAdminUsers.getState().users,
        selectedUser: useAdminUsers.getState().selectedUser,
      }));
      return result;
    },

    updateUserRole: async (userId, role) => {
      const result = await useAdminUsers.getState().updateUserRole(userId, role);
      set((state) => ({
        ...state,
        users: useAdminUsers.getState().users,
        selectedUser: useAdminUsers.getState().selectedUser,
      }));
      return result;
    },

    bulkUpdateUserRole: async (userIds, role) => {
      const result = await useAdminUsers.getState().bulkUpdateUserRole(userIds, role);
      set((state) => ({
        ...state,
        users: useAdminUsers.getState().users,
      }));
      return result;
    },

    // Transaction Methods - proxy to sub-store with state sync
    fetchTransactions: async (options) => {
      const result = await useAdminTransactions.getState().fetchTransactions(options);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
        loading: { ...state.loading, transactions: useAdminTransactions.getState().loading },
        error: { ...state.error, transactions: useAdminTransactions.getState().error },
        pagination: { ...state.pagination, transactions: useAdminTransactions.getState().pagination },
      }));
      return result;
    },

    getTransactionById: async (transactionId) => {
      return await useAdminTransactions.getState().getTransactionById(transactionId);
    },

    updateTransactionStatus: async (transactionId, status, notes) => {
      const result = await useAdminTransactions.getState().updateTransactionStatus(transactionId, status, notes);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
        selectedTransaction: useAdminTransactions.getState().selectedTransaction,
      }));
      return result;
    },

    approveTransaction: async (transactionId, notes) => {
      const result = await useAdminTransactions.getState().approveTransaction(transactionId, notes);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    rejectTransaction: async (transactionId, reason) => {
      const result = await useAdminTransactions.getState().rejectTransaction(transactionId, reason);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    cancelTransaction: async (transactionId, reason) => {
      const result = await useAdminTransactions.getState().cancelTransaction(transactionId, reason);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    refundTransaction: async (transactionId, reason) => {
      const result = await useAdminTransactions.getState().refundTransaction(transactionId, reason);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    markTransactionAsComplete: async (transactionId, notes) => {
      const result = await useAdminTransactions.getState().markTransactionAsComplete(transactionId, notes);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    addTransactionNote: async (transactionId, note) => {
      return await useAdminTransactions.getState().addTransactionNote(transactionId, note);
    },

    uploadTransactionReceipt: async (transactionId, file, receiptType, onProgress) => {
      return await useAdminTransactions.getState().uploadTransactionReceipt(transactionId, file, receiptType, onProgress);
    },

    deleteTransactionReceipt: async (transactionId, receiptType) => {
      return await useAdminTransactions.getState().deleteTransactionReceipt(transactionId, receiptType);
    },

    bulkUpdateTransactionStatus: async (transactionIds, status) => {
      const result = await useAdminTransactions.getState().bulkUpdateTransactionStatus(transactionIds, status);
      set((state) => ({
        ...state,
        transactions: useAdminTransactions.getState().transactions,
      }));
      return result;
    },

    // Exchange Rates Methods - proxy to sub-store with state sync
    fetchExchangeRates: async () => {
      const result = await useAdminRates.getState().fetchExchangeRates();
      set((state) => ({
        ...state,
        exchangeRates: useAdminRates.getState().exchangeRates,
        loading: { ...state.loading, rates: useAdminRates.getState().loading },
        error: { ...state.error, rates: useAdminRates.getState().error },
      }));
      return result;
    },

    getRateById: async (rateId) => {
      return await useAdminRates.getState().getRateById(rateId);
    },

    updateExchangeRate: async (rateId, data) => {
      const result = await useAdminRates.getState().updateExchangeRate(rateId, data);
      set((state) => ({
        ...state,
        exchangeRates: useAdminRates.getState().exchangeRates,
        selectedRate: useAdminRates.getState().selectedRate,
      }));
      return result;
    },

    createExchangeRate: async (data) => {
      const result = await useAdminRates.getState().createExchangeRate(data);
      set((state) => ({
        ...state,
        exchangeRates: useAdminRates.getState().exchangeRates,
      }));
      return result;
    },

    deleteExchangeRate: async (rateId) => {
      const result = await useAdminRates.getState().deleteExchangeRate(rateId);
      set((state) => ({
        ...state,
        exchangeRates: useAdminRates.getState().exchangeRates,
        selectedRate: useAdminRates.getState().selectedRate,
      }));
      return result;
    },

    toggleRateStatus: async (rateId, enabled) => {
      const result = await useAdminRates.getState().toggleRateStatus(rateId, enabled);
      set((state) => ({
        ...state,
        exchangeRates: useAdminRates.getState().exchangeRates,
        selectedRate: useAdminRates.getState().selectedRate,
      }));
      return result;
    },

    // Settings Methods - proxy to sub-store with state sync
    fetchSettings: async () => {
      const result = await useAdminSettings.getState().fetchSettings();
      set((state) => ({
        ...state,
        settings: useAdminSettings.getState().settings,
        loading: { ...state.loading, settings: useAdminSettings.getState().loading },
        error: { ...state.error, settings: useAdminSettings.getState().error },
      }));
      return result;
    },

    updateSettings: async (data) => {
      const result = await useAdminSettings.getState().updateSettings(data);
      set((state) => ({
        ...state,
        settings: useAdminSettings.getState().settings,
      }));
      return result;
    },

    // Bulk Email Methods - proxy to sub-store with state sync
    fetchEmailTemplates: async () => {
      const result = await useAdminBulkEmail.getState().fetchEmailTemplates();
      set((state) => ({
        ...state,
        emailTemplates: useAdminBulkEmail.getState().emailTemplates,
        loading: { ...state.loading, bulkEmail: useAdminBulkEmail.getState().loading },
        error: { ...state.error, bulkEmail: useAdminBulkEmail.getState().error },
      }));
      return result;
    },

    createEmailTemplate: async (data) => {
      const result = await useAdminBulkEmail.getState().createEmailTemplate(data);
      set((state) => ({
        ...state,
        emailTemplates: useAdminBulkEmail.getState().emailTemplates,
      }));
      return result;
    },

    updateEmailTemplate: async (templateId, data) => {
      const result = await useAdminBulkEmail.getState().updateEmailTemplate(templateId, data);
      set((state) => ({
        ...state,
        emailTemplates: useAdminBulkEmail.getState().emailTemplates,
      }));
      return result;
    },

    deleteEmailTemplate: async (templateId) => {
      const result = await useAdminBulkEmail.getState().deleteEmailTemplate(templateId);
      set((state) => ({
        ...state,
        emailTemplates: useAdminBulkEmail.getState().emailTemplates,
      }));
      return result;
    },

    sendBulkEmail: async (data) => {
      return await useAdminBulkEmail.getState().sendBulkEmail(data);
    },

    fetchEmailHistory: async (options) => {
      const result = await useAdminBulkEmail.getState().fetchEmailHistory(options);
      set((state) => ({
        ...state,
        emailHistory: useAdminBulkEmail.getState().emailHistory,
        loading: { ...state.loading, bulkEmail: useAdminBulkEmail.getState().loading },
        error: { ...state.error, bulkEmail: useAdminBulkEmail.getState().error },
        pagination: { ...state.pagination, emailHistory: useAdminBulkEmail.getState().pagination },
      }));
      return result;
    },

    // Testimonial Methods - proxy to sub-store with state sync
    fetchTestimonials: async () => {
      const result = await useAdminTestimonials.getState().fetchTestimonials();
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
        loading: { ...state.loading, testimonials: useAdminTestimonials.getState().loading },
        error: { ...state.error, testimonials: useAdminTestimonials.getState().error },
      }));
      return result;
    },

    getTestimonialById: async (testimonialId) => {
      return await useAdminTestimonials.getState().getTestimonialById(testimonialId);
    },

    createTestimonial: async (data, imageFile) => {
      const result = await useAdminTestimonials.getState().createTestimonial(data, imageFile!);
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
      }));
      return result;
    },

    updateTestimonial: async (testimonialId, data, imageFile) => {
      const result = await useAdminTestimonials.getState().updateTestimonial(testimonialId, data, imageFile);
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
        selectedTestimonial: useAdminTestimonials.getState().selectedTestimonial,
      }));
      return result;
    },

    deleteTestimonial: async (testimonialId) => {
      const result = await useAdminTestimonials.getState().deleteTestimonial(testimonialId);
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
        selectedTestimonial: useAdminTestimonials.getState().selectedTestimonial,
      }));
      return result;
    },

    toggleTestimonialStatus: async (testimonialId, isActive) => {
      const result = await useAdminTestimonials.getState().toggleTestimonialStatus(testimonialId, isActive);
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
        selectedTestimonial: useAdminTestimonials.getState().selectedTestimonial,
      }));
      return result;
    },

    reorderTestimonials: async (testimonials) => {
      const result = await useAdminTestimonials.getState().reorderTestimonials(testimonials);
      set((state) => ({
        ...state,
        testimonials: useAdminTestimonials.getState().testimonials,
      }));
      return result;
    },

    // Global utility methods
    resetErrors,
    clearUserError,
    clearTransactionError,
    clearRatesError,
    clearSettingsError,
    clearBulkEmailError,
    clearTestimonialsError,
    resetUsers,
    resetTransactions,
  };
});

export default useAdmin;