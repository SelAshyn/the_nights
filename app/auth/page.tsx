'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // User is already logged in, redirect to appropriate dashboard
          const userRole = localStorage.getItem('userRole');

          if (userRole === 'mentor') {
            router.push('/mentor/dashboard');
          } else {
            router.push('/user');
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500/20 border-t-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Welcome to MentorLaunch
          </h1>
          <p className="text-slate-300 text-lg mb-8">
            Choose your path to get started with personalized career guidance
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/auth/mentee')}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300"
          >
            🎓 I'm a Student (Mentee)
          </Button>

          <Button
            onClick={() => router.push('/auth/mentor')}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
          >
            👨‍🏫 I'm a Mentor
          </Button>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-teal-400 transition-colors duration-200 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
