import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'sb-auth-token',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(key, value);
            // Also sync to cookies for middleware access
            document.cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
          } catch {
            // Handle localStorage quota exceeded or other errors
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(key);
            // Also remove from cookies
            document.cookie = `${key}=; path=/; max-age=0`;
          } catch {
            // Handle errors silently
          }
        },
      },
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  }
);
