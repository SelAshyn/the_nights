'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { UserNavbar } from '@/components/UserNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

export default function MyPlansPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error('Auth or init error', err);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <UserNavbar />

      <div className="pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">📚 My Learning Plans</h1>
            <p className="text-slate-600 text-lg">Track your progress and manage your study roadmaps</p>
          </div>

          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Plans Yet</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Create personalized learning plans by asking MentorAssist for study roadmaps and career guidance!
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/user')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Explore Careers
              </Button>
              <Button
                onClick={() => {
                  const event = new CustomEvent('prefill-chat', {
                    detail: 'Create a 3-month learning plan for me based on my interests'
                  });
                  window.dispatchEvent(event);
                  router.push('/user');
                }}
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                💬 Ask MentorAssist
              </Button>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Study Schedules</h3>
              <p className="text-sm text-slate-600">Create and track weekly study schedules with reminders</p>
              <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                Coming Soon
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Milestone Tracking</h3>
              <p className="text-sm text-slate-600">Set goals and track your progress towards career milestones</p>
              <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                Coming Soon
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Progress Analytics</h3>
              <p className="text-sm text-slate-600">Visualize your learning journey with detailed analytics</p>
              <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      <Chat />
    </div>
  );
}

