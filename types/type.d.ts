// types/type.d.ts

// User related types
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserNotifications {
  newsAndUpdates: boolean;
  promotions: boolean;
}

export interface UserSecurity {
  biometricsEnabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  adamPoints: number;
  referralCode: string;
  referrals: string[]; // Array of user IDs who were referred
  notifications: UserNotifications;
  security: UserSecurity;
  addedAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Create user payload (for registration/creation)
export interface CreateUserPayload {
  name: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: UserRole;
  profilePicture?: string;
  referralCode?: string; // Code used to refer this user
}

// Update user payload (for profile updates)
export interface UpdateUserPayload {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  notifications?: Partial<UserNotifications>;
  security?: Partial<UserSecurity>;
}

// User session/auth types
export interface UserSession {
  user: User;
  sessionId: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  phoneNumber?: string;
  referralCode?: string;
}

// Recipient types
export interface SavedRecipient {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Referral types
export interface ReferralData {
  userId: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  adamPoints: number;
}

// Transaction types
export interface CreateTransactionData {
  fromAmount: number;
  discountAmount?: number;
  totalFromAmount: number;
  totalToAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  rateId: string;
  recipientDetails: {
    fullName: string;
    email: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  expiryMinutes?: number;
}

export interface TransactionFilters {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type?: 'exchange' | 'transfer';
  dateFrom?: string;
  dateTo?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Pagination state
export interface PaginationState {
  lastDoc: any;
  hasMore: boolean;
}

// File upload types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
}

export interface UploadedFile {
  id: string;
  url: string;
  downloadUrl: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormError[];
}

// Common UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
  onClose: () => void;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  actionUrl?: string;
}

// Environment configuration
export interface AppConfig {
  appwrite: {
    endpoint: string;
    projectId: string;
    databaseId: string;
    storageId: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Generic CRUD operation types
export interface CrudOperations<T> {
  create: (data: Omit<T, 'id' | 'addedAt' | 'updatedAt'>) => Promise<T>;
  getById: (id: string) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (filters?: any) => Promise<T[]>;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}