import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Get auth token from cookies
  let token = null;

  // Try to get the token from cookies in order of priority
  const sbAuthToken = req.cookies.get('sb-auth-token')?.value;
  const sbAccessToken = req.cookies.get('sb-access-token')?.value;

  if (sbAuthToken) {
    try {
      // If sb-auth-token contains JSON, extract the access_token
      const tokenData = JSON.parse(decodeURIComponent(sbAuthToken));
      token = tokenData.access_token || sbAuthToken;
    } catch {
      // If parsing fails, use the token as-is
      token = sbAuthToken;
    }
  } else if (sbAccessToken) {
    token = sbAccessToken;
  }

  // Define protected routes and their required roles
  const protectedRoutes = {
    '/user': 'mentee',
    '/user/': 'mentee',
    '/user/plans': 'mentee',
    '/user/saved': 'mentee',
    '/user/messages': 'mentee',
    '/welcome': 'mentee',
    '/mentor': 'mentor',
    '/mentor/': 'mentor',
    '/mentor/dashboard': 'mentor',
    '/mentor/profile': 'mentor',
    '/mentor/messages': 'mentor',
    '/mentor/mentees': 'mentor',
  };

  const pathname = req.nextUrl.pathname;

  // Check if the current path requires authentication
  const requiredRole = Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(route + '/')
  )?.[1];

  if (requiredRole) {
    // Route requires authentication
    if (!token) {
      // No token - redirect to appropriate auth page
      console.log(`[Middleware] No auth token for protected route: ${pathname}, redirecting to /auth/${requiredRole}`);
      const authUrl = new URL(`/auth/${requiredRole}`, req.url);
      return NextResponse.redirect(authUrl);
    }

    // Token exists, let the client-side handle role validation
    console.log(`[Middleware] Auth token found for route: ${pathname}`);
  }

  // Handle auth pages - if user has token, let client-side handle redirect
  if (pathname.startsWith('/auth/') && token) {
    // Let the client-side auth pages handle the redirect based on role
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/:path*',
    '/mentor/:path*',
    '/welcome',
    '/auth/:path*'
  ],
};
