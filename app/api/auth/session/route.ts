// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, rateLimits } from '@/lib/rateLimit';

// Session cookie settings
const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function POST(request: NextRequest) {
  // Rate limiting - 10 requests per minute (standard)
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`session:${clientId}`, rateLimits.standard);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token using Firebase Admin SDK
    try {
      const decodedToken = await verifyIdToken(idToken);
      
      // Token is valid, set the session cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: COOKIE_NAME,
        value: idToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });

      return NextResponse.json({ 
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
        }
      });
    } catch (verifyError: any) {
      console.error('Token verification error:', verifyError);
      return NextResponse.json(
        { error: 'Invalid token', details: verifyError.message },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error setting session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set session cookie', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to clear session cookie', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Verify endpoint to check if session is valid
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify the token
    try {
      const decodedToken = await verifyIdToken(sessionCookie.value);
      
      return NextResponse.json({
        authenticated: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
        }
      });
    } catch (verifyError) {
      // Token expired or invalid, clear the cookie
      cookieStore.delete(COOKIE_NAME);
      
      return NextResponse.json(
        { authenticated: false, error: 'Token expired' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session', details: error.message },
      { status: 500 }
    );
  }
}