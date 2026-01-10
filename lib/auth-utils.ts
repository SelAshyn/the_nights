import { supabase } from './supabase';

export type UserRole = 'mentor' | 'mentee';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  metadata: any;
}

/**
 * Get the current user's role from their session
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    return session.user.user_metadata?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if the current user has the required role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole();
  return currentRole === requiredRole;
}

/**
 * Redirect user to appropriate dashboard based on their role
 */
export function getRedirectPath(role: UserRole | null): string {
  switch (role) {
    case 'mentor':
      return '/mentor/dashboard';
    case 'mentee':
      return '/user';
    default:
      return '/auth';
  }
}

/**
 * Check if an email is available for a specific role
 */
export async function checkEmailAvailability(email: string, role: UserRole): Promise<{
  available: boolean;
  message: string;
  existing?: boolean;
}> {
  try {
    const response = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        role
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Email check failed:', error);
    return {
      available: true,
      message: 'Unable to verify email availability. Proceeding...'
    };
  }
}

/**
 * Sign out and redirect to appropriate auth page
 */
export async function signOutAndRedirect(redirectRole?: UserRole) {
  try {
    await supabase.auth.signOut();

    if (typeof window !== 'undefined') {
      const redirectPath = redirectRole ? `/auth/${redirectRole}` : '/auth';
      window.location.href = redirectPath;
    }
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
