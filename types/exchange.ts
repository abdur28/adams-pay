// types/exchange.ts - Updated Exchange Types

// Transaction interface for Firebase
export interface FirebaseTransaction {
  id: string;
  userId: string;
  type: 'exchange' | 'transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Transaction amounts
  fromAmount: number;
  discountAmount?: number;
  totalFromAmount?: number;
  totalToAmount?: number;
  
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  
  
  // Exchange rate used
  exchangeRate: number;
  rateId: string; // Reference to the exchange rate used
  
  // Recipient details
  recipientDetails: RecipientDetails;
  
  // Payment method (added for transfer detail page)
  paymentMethod?: PaymentMethodInfo;
  
  // Receipts
  fromReceipt?: ReceiptFile;
  toReceipt?: ReceiptFile;
  
  // Admin
  adminNotes?: string;
  
  // Timestamps
  expiresAt: any; // Firebase Timestamp
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  cancelledAt?: any;
}

// Receipt file structure
export interface ReceiptFile {
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: any;
}

// Simplified recipient details
export interface RecipientDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Payment method for exchange rates
export interface PaymentMethodInfo {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  instructions?: string;
}

// Exchange Rate - Simple version with just the rate
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number; // Exchange rate (e.g., 1 USD = 1500 NGN)
  enabled: boolean;
  paymentMethods: PaymentMethodInfo[]; // Payment methods for this rate
  minAmount: number;
  maxAmount: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Form data interfaces
export interface ExchangeRateFormData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  enabled: boolean;
  paymentMethods: PaymentMethodInfo[];
  minAmount: number;
  maxAmount: number;
}

// Currency options
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
  { code: 'USDT', name: 'Tether', symbol: 'USDT' },
] as const;

// Calculate transaction - Simple calculation
export function calculateExchange(
  fromAmount: number,
  rate: number
): {
  toAmount: number;
} {
  return {
    toAmount: fromAmount * rate,
  };
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

// Format currency amount
export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}