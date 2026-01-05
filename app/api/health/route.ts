import { NextResponse } from 'next/server';

export async function HEAD() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      groq: !!process.env.GROQ_API_KEY,
    }
  });
}
