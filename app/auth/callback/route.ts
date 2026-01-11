import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) {
        const userRole = data.session.user.user_metadata?.role;
        const userId = data.session.user.id;

        console.log('Auth callback - User role:', userRole, 'ID:', userId);

        // Redirect based on user role
        if (userRole === 'mentor') {
          console.log('Redirecting to mentor dashboard');
          return NextResponse.redirect(`${origin}/mentor/dashboard`);
        } else if (userRole === 'mentee') {
          console.log('Redirecting to mentee dashboard');
          return NextResponse.redirect(`${origin}/user`);
        } else {
          // Default redirect if no role is set - go to auth to choose role
          console.log('No role set, redirecting to auth');
          return NextResponse.redirect(`${origin}/auth`);
        }
      } else {
        console.error('Session exchange failed:', error?.message);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
    }
  }

  // Return the user to an error page with instructions
  console.log('Auth callback failed - no code provided');
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
