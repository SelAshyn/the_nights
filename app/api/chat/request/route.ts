import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to_user_id, message } = await req.json();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('chat_requests')
      .select('*')
      .eq('from_user_id', user.id)
      .eq('to_user_id', to_user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    // Get sender's name
    const fromUserName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const fromUserEmail = user.email || '';

    // Create chat request
    const { data, error } = await supabase
      .from('chat_requests')
      .insert({
        from_user_id: user.id,
        to_user_id,
        message,
        status: 'pending',
        from_user_name: fromUserName,
        from_user_email: fromUserEmail
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Chat request error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all requests for this user
    const { data, error } = await supabase
      .from('chat_requests')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add current user's name to requests where they are the recipient
    const currentUserName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const currentUserEmail = user.email || '';

    const requestsWithNames = (data || []).map((req: any) => ({
      ...req,
      // If current user is the recipient, add their info as to_user
      to_user_name: req.to_user_id === user.id ? currentUserName : (req.to_user_name || 'User'),
      to_user_email: req.to_user_id === user.id ? currentUserEmail : (req.to_user_email || ''),
      // from_user info should already be in the database
      from_user_name: req.from_user_name || 'User',
      from_user_email: req.from_user_email || ''
    }));

    return NextResponse.json({ requests: requestsWithNames });
  } catch (error: any) {
    console.error('Get requests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { request_id, status } = await req.json();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update request status
    const { data, error } = await supabase
      .from('chat_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .eq('to_user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update request error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
