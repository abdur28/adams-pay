// lib/notificationService.ts
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface NotificationData {
  userId: string;
  title: string;
  body: string;
  type?: 'transaction' | 'info' | 'success' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface EmailData {
  to: string;
  subject: string;
  templateName?: string;
  data?: Record<string, any>;
  emailType?: 'TRANSACTION' | 'CUSTOM';
}

export interface PushNotificationData {
  userId?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

export interface BulkEmailData {
  userIds: string[];
  subject: string;
  body: string;
  templateName?: string;
  scheduledAt?: string;
}

export interface TransactionNotificationData {
  transactionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  body: string;
  transactionData: any;
  notifyUser?: boolean;
  notifyAdmins?: boolean;
  sendPush?: boolean;
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class NotificationService {
  private baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  private apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
  private emailApiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || '';
  private pushApiKey = process.env.NEXT_PUBLIC_PUSH_API_KEY || '';
  private notificationApiKey = process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY || '';

  /**
   * Send in-app notification to a user
   */
  async sendInAppNotification(data: NotificationData): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.notificationApiKey,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error sending in-app notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send in-app notification',
      };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(data: EmailData): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.emailApiKey,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(data: PushNotificationData): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.pushApiKey,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send push notification');
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  }

  /**
   * Send bulk emails to multiple users
   */
  async sendBulkEmail(data: BulkEmailData): Promise<ServiceResult> {
    try {
      const { userIds, subject, body, templateName, scheduledAt } = data;

      // Get user emails from Firestore
      const userEmails: Array<{ email: string; name: string }> = [];
      
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.email) {
            userEmails.push({
              email: userData.email,
              name: userData.name || userData.fullName || 'User',
            });
          }
        }
      }

      if (userEmails.length === 0) {
        return {
          success: false,
          error: 'No valid email addresses found',
        };
      }

      // Send emails
      const emailPromises = userEmails.map((user) =>
        this.sendEmail({
          to: user.email,
          subject,
          templateName: templateName || 'custom',
          data: {
            title: subject,
            message: body,
            name: user.name,
          },
          emailType: 'CUSTOM',
        })
      );

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;

      return {
        success: successCount > 0,
        data: {
          total: userEmails.length,
          sent: successCount,
          failed: userEmails.length - successCount,
        },
      };
    } catch (error: any) {
      console.error('Error sending bulk emails:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bulk emails',
      };
    }
  }

  /**
   * Send transaction notification to user and admins
   */
  async sendTransactionNotification(
    data: TransactionNotificationData
  ): Promise<ServiceResult> {
    try {
      const results = {
        userNotification: false,
        userEmail: false,
        userPush: false,
        adminEmails: false,
      };

      // 1. Send to user (if enabled)
      if (data.notifyUser !== false) {
        // In-app notification
        const inAppResult = await this.sendInAppNotification({
          userId: data.userId,
          title: data.title,
          body: data.body,
          type: 'transaction',
          data: {
            transactionId: data.transactionId,
            status: data.transactionData.status,
            amount: data.transactionData.fromAmount,
            currency: data.transactionData.fromCurrency,
          },
        });

        results.userNotification = inAppResult.success;

        // Email notification
        const emailResult = await this.sendEmail({
          to: data.userEmail,
          subject: data.title,
          templateName: 'transaction',
          data: {
            id: data.transactionId,
            status: data.transactionData.status,
            amount: `${data.transactionData.totalfromAmount ? data.transactionData.totalfromAmount : data.transactionData.fromAmount} ${data.transactionData.fromCurrency}`,
            date: new Date().toLocaleString(),
            senderName: data.userName,
            recipientName: data.transactionData.recipientDetails?.fullName,
            description: `Exchange ${data.transactionData.fromCurrency} to ${data.transactionData.toCurrency}`,
          },
          emailType: 'TRANSACTION',
        });

        results.userEmail = emailResult.success;

        // Push notification (if enabled)
        if (data.sendPush !== false) {
          const pushResult = await this.sendPushNotification({
            userId: data.userId,
            title: data.title,
            body: data.body,
            data: {
              type: 'transaction',
              transactionId: data.transactionId,
              status: data.transactionData.status,
              deepLink: `/transaction/${data.transactionId}`,
            },
            priority: 'high',
          });

          results.userPush = pushResult.success;
        }
      }

      // 2. Send to admins (if enabled)
      if (data.notifyAdmins !== false) {
        const adminsResult = await this.notifyAdmins({
          transactionId: data.transactionId,
          userName: data.userName,
          userEmail: data.userEmail,
          transactionData: data.transactionData,
          action: data.title,
        });

        results.adminEmails = adminsResult.success;
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      console.error('Error sending transaction notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send transaction notification',
      };
    }
  }

  /**
   * Notify all admins via email about a transaction
   */
  async notifyAdmins(data: {
    transactionId: string;
    userName: string;
    userEmail: string;
    transactionData: any;
    action: string;
  }): Promise<ServiceResult> {
    try {
      // Fetch all active admin users
      const adminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('status', '==', 'active')
      );

      const adminsSnapshot = await getDocs(adminsQuery);

      if (adminsSnapshot.empty) {
        console.warn('No active admin users found');
        return { success: false, error: 'No admins found' };
      }

      const emailPromises = adminsSnapshot.docs.map(async (adminDoc) => {
        const adminData = adminDoc.data();
        const adminEmail = adminData.email;

        if (!adminEmail) return false;

        // Send email to admin
        const emailResult = await this.sendEmail({
          to: adminEmail,
          subject: `🔔 Transaction Update - ${data.transactionData.totalfromAmount ? data.transactionData.totalfromAmount : data.transactionData.fromAmount} ${data.transactionData.fromCurrency}`,
          templateName: 'custom',
          data: {
            title: data.action,
            message: `
              <strong>User:</strong> ${data.userName} (${data.userEmail})<br>
              <strong>Transaction ID:</strong> ${data.transactionId}<br>
              <strong>Amount:</strong> ${data.transactionData.totalfromAmount ? data.transactionData.totalfromAmount : data.transactionData.fromAmount} ${data.transactionData.fromCurrency} → ${data.transactionData.toAmount} ${data.transactionData.toCurrency}<br>
              <strong>Recipient:</strong> ${data.transactionData.recipientDetails?.fullName || 'N/A'}<br>
              <strong>Status:</strong> ${data.transactionData.status.toUpperCase()}<br>
              <strong>Exchange Rate:</strong> ${data.transactionData.exchangeRate}<br>
              <br>
              Please review this transaction in the admin dashboard.
            `,
            highlightTitle: `${data.transactionData.fromAmount} ${data.transactionData.fromCurrency}`,
            highlightMessage: `To ${data.transactionData.recipientDetails?.fullName || 'Recipient'}`,
            ctaText: 'View Transaction',
            ctaUrl: `${this.baseUrl}/admin/transactions/${data.transactionId}`,
          },
          emailType: 'CUSTOM',
        });

        return emailResult.success;
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r).length;

      return {
        success: successCount > 0,
        data: {
          total: adminsSnapshot.size,
          sent: successCount,
          failed: adminsSnapshot.size - successCount,
        },
      };
    } catch (error: any) {
      console.error('Error notifying admins:', error);
      return {
        success: false,
        error: error.message || 'Failed to notify admins',
      };
    }
  }

  /**
   * Send bulk notifications to multiple users (in-app + optional push)
   */
  async sendBulkNotifications(data: {
    userIds: string[];
    title: string;
    body: string;
    type?: string;
    sendPush?: boolean;
  }): Promise<ServiceResult> {
    try {
      const promises = data.userIds.map(async (userId) => {
        const results = {
          inApp: false,
          push: false,
        };

        // Send in-app notification
        const inAppResult = await this.sendInAppNotification({
          userId,
          title: data.title,
          body: data.body,
          type: (data.type as any) || 'info',
        });

        results.inApp = inAppResult.success;

        // Send push notification if enabled
        if (data.sendPush !== false) {
          const pushResult = await this.sendPushNotification({
            userId,
            title: data.title,
            body: data.body,
            data: {
              type: data.type || 'info',
            },
            priority: 'normal',
          });

          results.push = pushResult.success;
        }

        return results;
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.inApp || r.push).length;

      return {
        success: successCount > 0,
        data: {
          total: data.userIds.length,
          sent: successCount,
          failed: data.userIds.length - successCount,
        },
      };
    } catch (error: any) {
      console.error('Error sending bulk notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bulk notifications',
      };
    }
  }

  /**
   * Send bulk push notifications to multiple users
   */
  async sendBulkPushNotifications(data: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<ServiceResult> {
    try {
      const promises = data.userIds.map((userId) =>
        this.sendPushNotification({
          userId,
          title: data.title,
          body: data.body,
          data: data.data || {},
          priority: 'normal',
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;

      return {
        success: successCount > 0,
        data: {
          total: data.userIds.length,
          sent: successCount,
          failed: data.userIds.length - successCount,
        },
      };
    } catch (error: any) {
      console.error('Error sending bulk push notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bulk push notifications',
      };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;