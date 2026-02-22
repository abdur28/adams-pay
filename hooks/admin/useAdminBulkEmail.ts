// hooks/admin/useAdminBulkEmail.ts
// npx shadcn@latest add table button dialog input textarea select card badge

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
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  EmailTemplate,
  EmailHistory,
  BulkEmailData,
  FetchOptions,
  PaginationState,
  ActionResult,
} from '@/types/admin';
import { formatFirestoreTimestamp } from '@/lib/utils';
import notificationService from '@/lib/notificationService';
import auditLogger from '@/lib/auditLog';

interface AdminBulkEmailStore {
  // State
  emailTemplates: EmailTemplate[];
  emailHistory: EmailHistory[];
  selectedTemplate: EmailTemplate | null;
  
  // Loading & Error
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Actions
  fetchEmailTemplates: () => Promise<void>;
  getTemplateById: (templateId: string) => Promise<EmailTemplate | null>;
  createEmailTemplate: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  updateEmailTemplate: (templateId: string, data: Partial<EmailTemplate>) => Promise<ActionResult>;
  deleteEmailTemplate: (templateId: string) => Promise<ActionResult>;
  sendBulkEmail: (data: BulkEmailData, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  sendBulkNotification: (data: { userIds: string[]; title: string; body: string; sendEmail?: boolean; sendPush?: boolean }, adminId?: string, adminEmail?: string) => Promise<ActionResult>;
  fetchEmailHistory: (options?: FetchOptions) => Promise<void>;
  getEmailHistoryById: (historyId: string) => Promise<EmailHistory | null>;
  setSelectedTemplate: (template: EmailTemplate | null) => void;
  resetEmailHistory: () => void;
  clearError: () => void;
}

const useAdminBulkEmail = create<AdminBulkEmailStore>((set, get) => ({
  // Initial State
  emailTemplates: [],
  emailHistory: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  pagination: {
    lastDoc: null,
    hasMore: false,
  },

  // Fetch email templates
  fetchEmailTemplates: async () => {
    set({ loading: true, error: null });

    try {
      const templatesQuery = query(
        collection(db, 'emailTemplates'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(templatesQuery);

      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(doc.data().updatedAt),
      } as EmailTemplate));

      set({ emailTemplates: templates, loading: false });
    } catch (error: any) {
      console.error('Error fetching email templates:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch email templates',
      });
    }
  },

  // Get template by ID
  getTemplateById: async (templateId: string): Promise<EmailTemplate | null> => {
    try {
      const templateDoc = await getDoc(doc(db, 'emailTemplates', templateId));

      if (!templateDoc.exists()) return null;

      return {
        id: templateDoc.id,
        ...templateDoc.data(),
        createdAt: formatFirestoreTimestamp(templateDoc.data().createdAt),
        updatedAt: formatFirestoreTimestamp(templateDoc.data().updatedAt),
      } as EmailTemplate;
    } catch (error: any) {
      console.error('Error getting email template:', error);
      set({ error: error.message || 'Failed to get email template' });
      return null;
    }
  },

  // Create email template
  createEmailTemplate: async (
    data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const docRef = await addDoc(collection(db, 'emailTemplates'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newTemplate: EmailTemplate = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set(state => ({
        emailTemplates: [newTemplate, ...state.emailTemplates],
        loading: false,
      }));

      return { success: true, data: { id: docRef.id } };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create email template';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Update email template
  updateEmailTemplate: async (
    templateId: string,
    data: Partial<EmailTemplate>
  ): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      const templateRef = doc(db, 'emailTemplates', templateId);
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

      await updateDoc(templateRef, updateData);

      set(state => ({
        emailTemplates: state.emailTemplates.map(template =>
          template.id === templateId
            ? { ...template, ...data, updatedAt: new Date().toISOString() }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === templateId
          ? { ...state.selectedTemplate, ...data, updatedAt: new Date().toISOString() }
          : state.selectedTemplate,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update email template';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Delete email template
  deleteEmailTemplate: async (templateId: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      await deleteDoc(doc(db, 'emailTemplates', templateId));

      set(state => ({
        emailTemplates: state.emailTemplates.filter(t => t.id !== templateId),
        selectedTemplate: state.selectedTemplate?.id === templateId ? null : state.selectedTemplate,
        loading: false,
      }));

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete email template';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Send bulk email
  sendBulkEmail: async (data: BulkEmailData, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      let recipientIds: string[] = [];

      // If recipients is 'all' or filters are provided, fetch user IDs
      if (data.recipients.includes('all') || data.filters) {
        let usersQuery = query(collection(db, 'users'));

        // Apply filters if provided
        if (data.filters) {
          if (data.filters.role) {
            usersQuery = query(usersQuery, where('role', '==', data.filters.role));
          }
          if (data.filters.status) {
            usersQuery = query(usersQuery, where('status', '==', data.filters.status));
          }
          if (data.filters.registeredAfter) {
            usersQuery = query(usersQuery, where('addedAt', '>=', data.filters.registeredAfter));
          }
          if (data.filters.registeredBefore) {
            usersQuery = query(usersQuery, where('addedAt', '<=', data.filters.registeredBefore));
          }
        }

        const usersSnapshot = await getDocs(usersQuery);
        recipientIds = usersSnapshot.docs.map(doc => doc.id);
      } else {
        recipientIds = data.recipients;
      }

      if (recipientIds.length === 0) {
        set({ loading: false, error: 'No recipients found' });
        return { success: false, error: 'No recipients found' };
      }

      // Get template if templateId is provided
      let emailContent = {
        subject: data.subject,
        body: data.body,
      };

      if (data.templateId) {
        const template = await get().getTemplateById(data.templateId);
        if (template) {
          emailContent = {
            subject: template.subject,
            body: template.body,
          };
        }
      }

      // Send emails via notification service
      const result = await notificationService.sendBulkEmail({
        userIds: recipientIds,
        subject: emailContent.subject,
        body: emailContent.body,
        templateName: 'custom',
        scheduledAt: data.scheduledAt,
      });

      if (!result.success) {
        set({ loading: false, error: result.error });
        return { success: false, error: result.error };
      }

      // Add to email history
      const historyRef = await addDoc(collection(db, 'emailHistory'), {
        subject: emailContent.subject,
        body: emailContent.body,
        recipientCount: recipientIds.length,
        sentBy: adminEmail || 'Admin',
        sentById: adminId || 'unknown',
        status: data.scheduledAt ? 'scheduled' : 'sent',
        sentAt: data.scheduledAt ? null : serverTimestamp(),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdAt: serverTimestamp(),
        templateId: data.templateId,
        templateName: data.templateId ? get().emailTemplates.find(t => t.id === data.templateId)?.name : undefined,
      });

      set({ loading: false });

      // Audit log
      if (adminId) {
        auditLogger.logEmailAction(adminId, {
          subject: emailContent.subject,
          recipientCount: recipientIds.length,
          sent: result.data?.sent || 0,
          failed: result.data?.failed || 0,
          templateId: data.templateId,
          scheduled: !!data.scheduledAt,
        }, adminEmail);
      }

      return { 
        success: true, 
        data: { 
          historyId: historyRef.id, 
          recipientCount: recipientIds.length,
          sent: result.data?.sent || 0,
          failed: result.data?.failed || 0
        } 
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send bulk email';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Send bulk notification (in-app + optional email + optional push)
  sendBulkNotification: async (data: {
    userIds: string[];
    title: string;
    body: string;
    sendEmail?: boolean;
    sendPush?: boolean;
  }, adminId?: string, adminEmail?: string): Promise<ActionResult> => {
    set({ loading: true, error: null });

    try {
      if (data.userIds.length === 0) {
        set({ loading: false, error: 'No recipients found' });
        return { success: false, error: 'No recipients found' };
      }

      const results = {
        notifications: { sent: 0, failed: 0 },
        emails: { sent: 0, failed: 0 },
        push: { sent: 0, failed: 0 },
      };

      // Send in-app notifications + optional push
      const notificationResult = await notificationService.sendBulkNotifications({
        userIds: data.userIds,
        title: data.title,
        body: data.body,
        type: 'info',
        sendPush: data.sendPush,
      });

      if (notificationResult.success && notificationResult.data) {
        results.notifications.sent = notificationResult.data.sent || 0;
        results.notifications.failed = notificationResult.data.failed || 0;
      }

      // Send emails if requested
      if (data.sendEmail) {
        const emailResult = await notificationService.sendBulkEmail({
          userIds: data.userIds,
          subject: data.title,
          body: data.body,
          templateName: 'custom',
        });

        if (emailResult.success && emailResult.data) {
          results.emails.sent = emailResult.data.sent || 0;
          results.emails.failed = emailResult.data.failed || 0;
        }
      }

      set({ loading: false });

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send bulk notification';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Fetch email history with pagination
  fetchEmailHistory: async (options: FetchOptions = {}) => {
    set({ loading: true, error: null });

    try {
      const {
        limit: limitCount = 20,
        startAfter: startAfterDoc,
        orderByField = 'createdAt',
        orderDirection = 'desc',
      } = options;

      // Build query
      let historyQuery = query(
        collection(db, 'emailHistory'),
        orderBy(orderByField, orderDirection)
      );

      // Apply pagination
      let paginatedQuery;
      if (startAfterDoc || get().pagination.lastDoc) {
        const lastDoc = startAfterDoc || get().pagination.lastDoc;
        paginatedQuery = query(historyQuery, startAfter(lastDoc), limit(limitCount));
      } else {
        paginatedQuery = query(historyQuery, limit(limitCount));
      }

      const snapshot = await getDocs(paginatedQuery);

      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: formatFirestoreTimestamp(doc.data().sentAt),
        scheduledAt: formatFirestoreTimestamp(doc.data().scheduledAt),
        createdAt: formatFirestoreTimestamp(doc.data().createdAt),
      } as EmailHistory));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      set({
        emailHistory: options.startAfter ? [...get().emailHistory, ...history] : history,
        loading: false,
        pagination: {
          lastDoc: lastVisible,
          hasMore: snapshot.docs.length === limitCount,
        },
      });
    } catch (error: any) {
      console.error('Error fetching email history:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch email history',
      });
    }
  },

  // Get email history by ID
  getEmailHistoryById: async (historyId: string): Promise<EmailHistory | null> => {
    try {
      const historyDoc = await getDoc(doc(db, 'emailHistory', historyId));

      if (!historyDoc.exists()) return null;

      return {
        id: historyDoc.id,
        ...historyDoc.data(),
        sentAt: formatFirestoreTimestamp(historyDoc.data().sentAt),
        scheduledAt: formatFirestoreTimestamp(historyDoc.data().scheduledAt),
        createdAt: formatFirestoreTimestamp(historyDoc.data().createdAt),
      } as EmailHistory;
    } catch (error: any) {
      console.error('Error getting email history:', error);
      set({ error: error.message || 'Failed to get email history' });
      return null;
    }
  },

  // Utility actions
  setSelectedTemplate: (template: EmailTemplate | null) => set({ selectedTemplate: template }),
  resetEmailHistory: () => set({ emailHistory: [], pagination: { lastDoc: null, hasMore: false } }),
  clearError: () => set({ error: null }),
}));

export default useAdminBulkEmail;