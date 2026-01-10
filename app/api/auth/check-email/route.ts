import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for email check');
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['mentor', 'mentee'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be mentor or mentee' },
        { status: 400 }
      );
    }

    // Create admin client to check all users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with this email
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to check email availability' },
        { status: 500 }
      );
    }

    // Find user with matching email
    const existingUser = users.users.find(user =>
      user.email?.toLowerCase() === email.toLowerCase()
    );

    if (!existingUser) {
      // Email is available
      return NextResponse.json({
        available: true,
        message: 'Email is available'
      });
    }

    // Check the existing user's role
    const existingRole = existingUser.user_metadata?.role;

    if (existingRole === role) {
      // Same role - this is fine for sign-in
      return NextResponse.json({
        available: true,
        existing: true,
        message: `Email already registered as ${role}`
      });
    } else if (existingRole && existingRole !== role) {
      // Different role - not allowed
      const oppositeRole = existingRole === 'mentor' ? 'mentee' : 'mentor';
      return NextResponse.json({
        available: false,
        message: `This email is already registered as a ${existingRole}. Please use a different email for ${role} registration or sign in as a ${existingRole}.`
      });
    } else {
      // No role metadata - might be an old user, allow but warn
      return NextResponse.json({
        available: true,
        warning: true,
        message: 'Email exists but role is unclear. Proceeding with caution.'
      });
    }

  } catch (error: any) {
    console.error('Email check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
