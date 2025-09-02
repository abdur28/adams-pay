// lib/email.ts
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Email types
export const EmailType = {
  EMAIL_OTP: 'email-otp',
  CUSTOM: 'custom', 
  TRANSACTION: 'transaction'
} as const;

// Email options interface
interface EmailOptions {
  to: string;
  subject: string;
  templateName: string;
  data?: Record<string, any>;
  emailType: any;
}

// Template data interface
interface TemplateData {
  title?: string;
  currentYear?: number;
  websiteUrl?: string;
  message?: string;
  [key: string]: any;
}

// Transaction data interface
interface TransactionData {
  id: string;
  status: string;
  amount?: string;
  date?: string;
  senderName?: string;
  recipientName?: string;
  description?: string;
  fees?: string;
  reason?: string;
  [key: string]: any;
}

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD 
  }
});

// Register custom Handlebars helpers
handlebars.registerHelper('eq', (a: any, b: any): boolean => {
  return a === b;
});

handlebars.registerHelper('gt', (a: number, b: number): boolean => {
  return a > b;
});

handlebars.registerHelper('lt', (a: number, b: number): boolean => {
  return a < b;
});

handlebars.registerHelper('or', (...args: any[]): boolean => {
  // Remove the last argument which is the options object
  const values = args.slice(0, -1);
  return values.some(val => !!val);
});

handlebars.registerHelper('and', (...args: any[]): boolean => {
  // Remove the last argument which is the options object
  const values = args.slice(0, -1);
  return values.every(val => !!val);
});

/**
 * Get compiled email template
 */
function getCompiledTemplate(templateName: string, templateData: TemplateData): string {
  try {
    const templatePath = path.join(process.cwd(), 'emails', `${templateName}.html`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(templateData);
  } catch (error) {
    console.error(`Template error: ${error}`);
    // Fallback HTML
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>${templateData.title || 'Notification'}</h2>
        <p>${templateData.message || ''}</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;
  }
}

/**
 * Send email with template
 */
export async function sendEmailWithTemplate(options: EmailOptions): Promise<boolean> {
  const { to, subject, templateName, data, emailType } = options;
  
  try {
    // Default template data
    const templateData: TemplateData = {
      title: subject,
      currentYear: new Date().getFullYear(),
      websiteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://raiden-express.vercel.app',
      ...data
    };

    const html = getCompiledTemplate(templateName, templateData);
    
    // Development mode - log instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.EMAIL_DEBUG === 'true') {
      console.log('-------- EMAIL DEBUG --------');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Type: ${emailType}`);
      console.log(`HTML: ${html}`);
      return true;
    }
    
    // Send email
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Raiden Express'}" <info@raiden-express.com>`,
      to: to,
      subject: subject,
      html: html,
      headers: {
        'X-Email-Type': emailType
      }
    });
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  to: string, 
  otp: string, 
  expiresInMinutes: number = 15
): Promise<boolean> {
  return sendEmailWithTemplate({
    to,
    subject: 'Your Verification Code',
    templateName: 'email-otp',
    data: {
      otp,
      expiresInMinutes,
    },
    emailType: EmailType.EMAIL_OTP
  });
}

/**
 * Send custom email
 */
export async function sendCustomEmail(
  to: string, 
  subject: string, 
  message: string, 
  data: Record<string, any> = {}
): Promise<boolean> {
  return sendEmailWithTemplate({
    to,
    subject,
    templateName: 'custom',
    data: {
      message,
      ...data
    },
    emailType: EmailType.CUSTOM
  });
}

/**
 * Send transaction email
 */
export async function sendTransactionEmail(
  to: string, 
  transactionData: TransactionData
): Promise<boolean> {
  return sendEmailWithTemplate({
    to,
    subject: `Transaction ${transactionData.status} - ${transactionData.id}`,
    templateName: 'transaction',
    data: transactionData,
    emailType: EmailType.TRANSACTION
  });
}