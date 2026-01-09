import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to use service role key if available for admin API
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceKey) {
      const adminSupabase = createClient(supabaseUrl, serviceKey);

      const { data: { users }, error } = await adminSupabase.auth.admin.listUsers();

      if (!error && users) {
        const mentees = users
          .filter(user => user.user_metadata?.role === 'mentee')
          .map(user => ({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at,
            is_active: user.last_sign_in_at
              ? (new Date().getTime() - new Date(user.last_sign_in_at).getTime()) < 30 * 60 * 1000
              : false
          }));

        return NextResponse.json({
          total: mentees.length,
          active: mentees.filter(m => m.is_active).length,
          mentees: mentees.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return new Date(b.last_sign_in || 0).getTime() - new Date(a.last_sign_in || 0).getTime();
          })
        });
      }
    }

    // Fallback: Return empty data with instructions
    return NextResponse.json({
      total: 0,
      active: 0,
      mentees: [],
      message: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local to see real mentee data'
    });

  } catch (error: any) {
    console.error('Error in active mentees API:', error);
    return NextResponse.json({
      total: 0,
      active: 0,
      mentees: [],
      error: error.message
    }, { status: 200 });
  }
}
