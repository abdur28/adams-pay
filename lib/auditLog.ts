// lib/auditLog.ts
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type AuditAction =
  // User actions
  | 'USER_UPDATE'
  | 'USER_STATUS_CHANGE'
  | 'USER_ROLE_CHANGE'
  | 'USER_BULK_ROLE_CHANGE'
  // Transaction actions
  | 'TRANSACTION_STATUS_UPDATE'
  | 'TRANSACTION_APPROVE'
  | 'TRANSACTION_REJECT'
  | 'TRANSACTION_CANCEL'
  | 'TRANSACTION_REFUND'
  | 'TRANSACTION_COMPLETE'
  | 'TRANSACTION_NOTE_ADD'
  | 'TRANSACTION_RECEIPT_UPLOAD'
  | 'TRANSACTION_RECEIPT_DELETE'
  | 'TRANSACTION_BULK_STATUS_UPDATE'
  // Rate actions
  | 'RATE_CREATE'
  | 'RATE_UPDATE'
  | 'RATE_DELETE'
  | 'RATE_TOGGLE_STATUS'
  // Settings actions
  | 'SETTINGS_UPDATE'
  // Testimonial actions
  | 'TESTIMONIAL_CREATE'
  | 'TESTIMONIAL_UPDATE'
  | 'TESTIMONIAL_DELETE'
  | 'TESTIMONIAL_TOGGLE_STATUS'
  // Email actions
  | 'BULK_EMAIL_SEND';

export type AuditResourceType =
  | 'user'
  | 'transaction'
  | 'rate'
  | 'settings'
  | 'testimonial'
  | 'email';

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  adminId: string;
  adminEmail?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Timestamp | string;
}

export interface AuditLogFilters {
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  adminId?: string;
  startDate?: Date;
  endDate?: Date;
}

class AuditLogger {
  private collectionName = 'auditLogs';

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...entry,
        timestamp: serverTimestamp(),
      });

      console.log(`[Audit] ${entry.action} on ${entry.resourceType}:${entry.resourceId} by ${entry.adminId}`);

      return docRef.id;
    } catch (error) {
      console.error('[Audit] Failed to log action:', error);
      return null;
    }
  }

  async logUserAction(
    adminId: string,
    action: AuditAction,
    userId: string,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action,
      resourceType: 'user',
      resourceId: userId,
      adminId,
      adminEmail,
      details,
    });
  }

  async logTransactionAction(
    adminId: string,
    action: AuditAction,
    transactionId: string,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action,
      resourceType: 'transaction',
      resourceId: transactionId,
      adminId,
      adminEmail,
      details,
    });
  }

  async logRateAction(
    adminId: string,
    action: AuditAction,
    rateId: string,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action,
      resourceType: 'rate',
      resourceId: rateId,
      adminId,
      adminEmail,
      details,
    });
  }

  async logSettingsAction(
    adminId: string,
    action: AuditAction,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action,
      resourceType: 'settings',
      resourceId: 'global',
      adminId,
      adminEmail,
      details,
    });
  }

  async logTestimonialAction(
    adminId: string,
    action: AuditAction,
    testimonialId: string,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action,
      resourceType: 'testimonial',
      resourceId: testimonialId,
      adminId,
      adminEmail,
      details,
    });
  }

  async logEmailAction(
    adminId: string,
    details: Record<string, unknown>,
    adminEmail?: string
  ): Promise<string | null> {
    return this.log({
      action: 'BULK_EMAIL_SEND',
      resourceType: 'email',
      resourceId: `bulk-${Date.now()}`,
      adminId,
      adminEmail,
      details,
    });
  }

  async getRecentLogs(limitCount: number = 50): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry));
    } catch (error) {
      console.error('[Audit] Failed to get recent logs:', error);
      return [];
    }
  }

  async getLogsByResource(
    resourceType: AuditResourceType,
    resourceId: string,
    limitCount: number = 20
  ): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry));
    } catch (error) {
      console.error('[Audit] Failed to get logs by resource:', error);
      return [];
    }
  }

  async getLogsByAdmin(
    adminId: string,
    limitCount: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as AuditLogEntry));
    } catch (error) {
      console.error('[Audit] Failed to get logs by admin:', error);
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
