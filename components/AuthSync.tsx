'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * AuthSync component - Syncs Supabase auth state to cookies
 * This enables the middleware to access auth tokens from cookies
 * Should be placed in the root layout
 */
export function AuthSync() {
  useEffect(() => {
    let mounted = true;

    // Function to sync auth state to cookies
    const syncAuthToCookies = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          // Store access token in cookie for middleware
          const tokenData = JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user_id: session.user?.id,
          });

          document.cookie = `sb-auth-token=${encodeURIComponent(tokenData)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

          console.log('[AuthSync] Synced auth token to cookies for user:', session.user?.id);
        } else {
          // Clear cookies if no session
          document.cookie = `sb-auth-token=; path=/; max-age=0`;
          document.cookie = `sb-access-token=; path=/; max-age=0`;
          console.log('[AuthSync] Cleared auth cookies');
        }
      } catch (error) {
        console.error('[AuthSync] Error syncing auth to cookies:', error);
      }
    };

    // Initial sync
    syncAuthToCookies();

    // Listen to auth state changes and sync immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[AuthSync] Auth state changed:', event);

      if (session?.access_token) {
        // Sync new session to cookies
        const tokenData = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user_id: session.user?.id,
        });

        document.cookie = `sb-auth-token=${encodeURIComponent(tokenData)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

        console.log('[AuthSync] Session established and synced to cookies');
      } else {
        // Clear cookies when logged out
        document.cookie = `sb-auth-token=; path=/; max-age=0`;
        document.cookie = `sb-access-token=; path=/; max-age=0`;
        console.log('[AuthSync] Session cleared and cookies removed');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return null;
}
