import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Session cookie name (must match the one in session route)
const SESSION_COOKIE_NAME = '__session';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the session token from cookies
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  // Define protected routes
  const protectedRoutes = ['/transactions', '/recipients', '/referrals', '/settings', '/admin'];
  const authRoutes = ['/sign-in', '/register', '/forgot-password', '/verify-otp'];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !sessionCookie) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If user is authenticated and trying to access auth routes (except verify-otp)
  if (isAuthRoute && sessionCookie && !pathname.startsWith('/verify-otp')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};