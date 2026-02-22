// app/api/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, rateLimits } from '@/lib/rateLimit';

// Define validation interface
interface SendOTPRequest {
  email: string;
  otp: string;
  expiresInMinutes?: number;
  apiKey?: string;
}

/**
 * Validate API key from request
 */
function validateApiKey(request: NextRequest, bodyApiKey?: string): boolean {
  // Skip validation in development
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_API_KEY) {
    return true;
  }
  
  const headerApiKey = request.headers.get('x-api-key');
  const apiKey = headerApiKey || bodyApiKey;
  
  return apiKey === process.env.EMAIL_API_KEY;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate OTP format (6 digits)
 */
function isValidOTP(otp: string): boolean {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * POST handler for sending OTP emails
 */
export async function POST(request: NextRequest) {
  // Rate limiting - 5 requests per minute for OTP (strict)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`otp:${clientId}`, rateLimits.strict);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json() as SendOTPRequest;
    
    console.log('OTP email request received:', {
      email: body.email,
      otpLength: body.otp?.length || 0,
      expiresInMinutes: body.expiresInMinutes || 15
    });
    
    // Validate required fields
    if (!body.email || !body.otp) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: "email" and "otp" are required' 
      }, { status: 400 });
    }
    
    // Validate email format
    if (!isValidEmail(body.email)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email address format' 
      }, { status: 400 });
    }
    
    // Validate OTP format
    if (!isValidOTP(body.otp)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid OTP format. OTP must be 6 digits' 
      }, { status: 400 });
    }
    
    // Validate API key
    if (!validateApiKey(request, body.apiKey)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or missing API key' 
      }, { status: 401 });
    }

    // Set default expiry time if not provided
    const expiresInMinutes = body.expiresInMinutes || 15;
    
    // Validate expiry time (should be between 5 and 60 minutes)
    if (expiresInMinutes < 5 || expiresInMinutes > 60) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid expiry time. Must be between 5 and 60 minutes' 
      }, { status: 400 });
    }
    
    // Send the OTP email using the sendOTPEmail function
    const result = await sendOTPEmail(
      body.email.toLowerCase(),
      body.otp,
      expiresInMinutes
    );
    
    if (result) {
      console.log(`OTP email sent successfully to ${body.email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'OTP email sent successfully',
        data: {
          email: body.email.toLowerCase(),
          expiresInMinutes
        }
      });
    } else {
      console.error(`Failed to send OTP email to ${body.email}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    
    // Handle specific error types
    let errorMessage = 'An error occurred while sending OTP email';
    let statusCode = 500;
    
    if (error.name === 'SyntaxError') {
      errorMessage = 'Invalid JSON format in request body';
      statusCode = 400;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Email service temporarily unavailable';
      statusCode = 503;
    } else if (error.responseCode === 535) {
      errorMessage = 'Email authentication failed';
      statusCode = 500;
    }
    
    return NextResponse.json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'OTP email API is operational',
    data: {
      service: 'send-otp',
      version: '1.0.0',
      status: 'healthy'
    }
  });
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json({ 
    success: false, 
    message: 'Method not allowed' 
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    success: false, 
    message: 'Method not allowed' 
  }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ 
    success: false, 
    message: 'Method not allowed' 
  }, { status: 405 });
}