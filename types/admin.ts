// types/admin.ts

import { User } from './type';
import { FirebaseTransaction, ExchangeRate } from './exchange';
import { DocumentSnapshot } from 'firebase/firestore';

// Admin Store State
export interface AdminStore {
  // User Management State
  users: User[];
  selectedUser: User | null;

  // Transaction Management State
  transactions: FirebaseTransaction[];
  selectedTransaction: FirebaseTransaction | null;

  // Exchange Rates State
  exchangeRates: ExchangeRate[];
  selectedRate: ExchangeRate | null;
  
  // Settings State
  settings: AdminSettings | null;

  // Bulk Email State
  emailTemplates: EmailTemplate[];
  emailHistory: EmailHistory[];

  // Loading States
  loading: {
    users: boolean;
    transactions: boolean;
    rates: boolean;
    settings: boolean;
    bulkEmail: boolean;
    adminAction: boolean;
  };

  // Error States
  error: {
    users: string | null;
    transactions: string | null;
    rates: string | null;
    settings: string | null;
    bulkEmail: string | null;
    adminAction: string | null;
  };

  // Pagination State
  pagination: {
    users: PaginationState;
    transactions: PaginationState;
    emailHistory: PaginationState;
  };

  // Admin User Actions
  fetchUsers: (options?: FetchOptions) => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<ActionResult>;
  toggleUserStatus: (userId: string, status: User['status']) => Promise<ActionResult>;
  updateUserRole: (userId: string, role: User['role']) => Promise<ActionResult>;
  bulkUpdateUserRole: (userIds: string[], role: User['role']) => Promise<ActionResult>;

  // Transaction Actions
  fetchTransactions: (options?: FetchOptions) => Promise<void>;
  getTransactionById: (transactionId: string) => Promise<FirebaseTransaction | null>;
  updateTransactionStatus: (transactionId: string, status: FirebaseTransaction['status'], notes?: string) => Promise<ActionResult>;
  approveTransaction: (transactionId: string, notes?: string) => Promise<ActionResult>;
  rejectTransaction: (transactionId: string, reason: string) => Promise<ActionResult>;
  cancelTransaction: (transactionId: string, reason?: string) => Promise<ActionResult>;
  refundTransaction: (transactionId: string, reason?: string) => Promise<ActionResult>;
  markTransactionAsComplete: (transactionId: string, notes?: string) => Promise<ActionResult>;
  addTransactionNote: (transactionId: string, note: string) => Promise<ActionResult>;
  uploadTransactionReceipt: (transactionId: string, file: File, receiptType: 'fromReceipt' | 'toReceipt', onProgress?: (progress: number) => void) => Promise<ActionResult>;
  deleteTransactionReceipt: (transactionId: string, receiptType: 'fromReceipt' | 'toReceipt') => Promise<ActionResult>;
  bulkUpdateTransactionStatus: (transactionIds: string[], status: FirebaseTransaction['status']) => Promise<ActionResult>;

  // Exchange Rates Actions
  fetchExchangeRates: () => Promise<void>;
  getRateById: (rateId: string) => Promise<ExchangeRate | null>;
  updateExchangeRate: (rateId: string, data: Partial<ExchangeRate>) => Promise<ActionResult>;
  createExchangeRate: (data: Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  deleteExchangeRate: (rateId: string) => Promise<ActionResult>;
  toggleRateStatus: (rateId: string, enabled: boolean) => Promise<ActionResult>;

  // Settings Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<AdminSettings>) => Promise<ActionResult>;
  
  // Bulk Email Actions
  fetchEmailTemplates: () => Promise<void>;
  createEmailTemplate: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  updateEmailTemplate: (templateId: string, data: Partial<EmailTemplate>) => Promise<ActionResult>;
  deleteEmailTemplate: (templateId: string) => Promise<ActionResult>;
  sendBulkEmail: (data: BulkEmailData) => Promise<ActionResult>;
  fetchEmailHistory: (options?: FetchOptions) => Promise<void>;

  // Utility Actions
  resetErrors: () => void;
  clearUserError: () => void;
  clearTransactionError: () => void;
  clearRatesError: () => void;
  clearSettingsError: () => void;
  clearBulkEmailError: () => void;
  resetUsers: () => void;
  resetTransactions: () => void;
}

// Admin Settings Types
export interface AdminSettings {
  id: string;
  siteEmail: string;
  sitePhone: string;
  
  transactionExpiryMinutes: number;
  
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Social links
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // e.g., ['userName', 'transactionId']
  type: 'transaction' | 'marketing' | 'announcement' | 'alert' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Bulk Email Types
export interface BulkEmailData {
  templateId?: string;
  subject: string;
  body: string;
  recipients: string[]; // Array of user IDs or 'all'
  filters?: {
    role?: User['role'];
    status?: User['status'];
    registeredAfter?: string;
    registeredBefore?: string;
  };
  scheduledAt?: string; // ISO date string for scheduled emails
  attachments?: File[];
}

export interface EmailHistory {
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentBy: string;
  sentById: string;
  status: 'sent' | 'failed' | 'scheduled' | 'pending';
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
  templateId?: string;
  templateName?: string;
}

// Fetch Options
export interface FetchOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
  filters?: FilterOption[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOption {
  field: string;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any';
  value: any;
}

// Pagination State
export interface PaginationState {
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// Action Result
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Stats Types for Dashboard
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

// Notification Data Types
export interface BulkNotificationData {
  userIds: string[];
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  deepLink?: string;
  priority?: 'low' | 'normal' | 'high';
  templateName?: string;
}

export interface TransactionNotificationData {
  userId: string;
  transactionId: string;
  title: string;
  message: string;
  type: 'transaction_created' | 'transaction_approved' | 'transaction_completed' | 'transaction_failed' | 'transaction_cancelled';
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  templateName?: string;
}