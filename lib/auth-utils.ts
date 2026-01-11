import { supabase } from './supabase';

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user's role from their session
 */
export async function getCurrentUserRole() {
  try {
    const session = await getCurrentSession();

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
export async function hasRole(requiredRole: 'mentor' | 'mentee') {
  const currentRole = await getCurrentUserRole();
  return currentRole === requiredRole;
}

/**
 * Redirect user to appropriate dashboard based on their role
 */
export function getRedirectPath(role: string | null) {
  switch (role) {
    case 'mentor':
      return '/mentor/dashboard';
    case 'mentee':
      return '/user';
    default:
      return '/auth/mentee';
  }
}

/**
 * Sign out and clear local storage
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}

