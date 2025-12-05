'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/mentor');
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth/mentor');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  return (
    <>
      <MentorNavbar />
      <div className="min-h-screen pt-28 pb-12 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">💬 Messages</h1>
            <p className="text-slate-600 text-lg">Chat with your mentees</p>
          </div>

          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border-2 border-purple-200">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Messages Coming Soon</h2>
            <p className="text-slate-600 mb-6">
              The messaging interface is being integrated. For now, use the Chat component in the bottom right corner.
            </p>
            <button
              onClick={() => {
                // Trigger chat component to open
                const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                if (chatButton) chatButton.click();
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Open Chat
            </button>
          </div>
        </div>
      </div>

      <Chat />
    </>
  );
}
