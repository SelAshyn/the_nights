import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Fetching mentors... Service key exists:', !!serviceKey);

    if (serviceKey) {
      const adminSupabase = createClient(supabaseUrl, serviceKey);

      const { data: { users }, error } = await adminSupabase.auth.admin.listUsers();

      console.log('Users fetched:', users?.length, 'Error:', error);

      if (!error && users) {
        const mentors = users
          .filter(user => user.user_metadata?.role === 'mentor')
          .map(user => ({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mentor',
            profession: user.user_metadata?.profession || 'Professional',
            experience: user.user_metadata?.experience || 'Experienced',
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at,
            is_active: user.last_sign_in_at
              ? (new Date().getTime() - new Date(user.last_sign_in_at).getTime()) < 30 * 60 * 1000
              : false
          }));

        console.log('Mentors found:', mentors.length, 'Active:', mentors.filter(m => m.is_active).length);

        return NextResponse.json({
          total: mentors.length,
          active: mentors.filter(m => m.is_active).length,
          mentors: mentors.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return new Date(b.last_sign_in || 0).getTime() - new Date(a.last_sign_in || 0).getTime();
          })
        });
      }
    }

    // Fallback: Return empty data
    return NextResponse.json({
      total: 0,
      active: 0,
      mentors: [],
      message: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local to see real mentor data'
    });

  } catch (error: any) {
    console.error('Error in active mentors API:', error);
    return NextResponse.json({
      total: 0,
      active: 0,
      mentors: []
    }, { status: 200 });
  }
}
