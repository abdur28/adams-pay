// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithTemplate, sendTransactionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify API key (optional but recommended)
    const apiKey = request.headers.get('x-api-key');
    if (process.env.EMAIL_API_KEY && apiKey !== process.env.EMAIL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, templateName, data, emailType } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    // If it's a transaction email, use the transaction template
    if (emailType === 'TRANSACTION' && data?.id) {
      const success = await sendTransactionEmail(to, data);
      
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Transaction email sent successfully' 
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to send transaction email' },
          { status: 500 }
        );
      }
    }

    // For custom emails
    const success = await sendEmailWithTemplate({
      to,
      subject,
      templateName: templateName || 'custom',
      data,
      emailType: emailType || 'CUSTOM'
    });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}