import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Get auth token from cookies
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get('supabase-auth-token')?.value;

  // Define protected routes and their required roles
  const protectedRoutes = {
    '/user': 'mentee',
    '/user/': 'mentee',
    '/user/plans': 'mentee',
    '/user/saved': 'mentee',
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
      const authUrl = new URL(`/auth/${requiredRole}`, req.url);
      return NextResponse.redirect(authUrl);
    }

    // For now, we'll let the client-side handle role validation
    // since we can't easily decode JWT in middleware without additional dependencies
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
