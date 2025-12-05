'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default function MenteesPage() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<any[]>([]);
  const router = useRouter();

  const fetchMentees = async () => {
    try {
      // Fetch all mentees from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentee')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching mentees:', error.message);
        setMentees([]);
      } else {
        setMentees(data || []);
      }
    } catch (error: any) {
      console.warn('Error fetching mentees:', error.message);
      setMentees([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/mentor');
          return;
        }

        await fetchMentees();
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
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">👥 All Mentees</h1>
            <p className="text-slate-600 text-lg">View all registered mentees in the system</p>
          </div>

          {/* All Mentees */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              📚 Registered Mentees ({mentees.length})
            </h2>
            {mentees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentees.map((mentee) => (
                  <div key={mentee.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {(mentee.full_name || mentee.email || 'M').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{mentee.full_name || 'Mentee'}</h3>
                        <p className="text-sm text-slate-600 truncate">{mentee.email}</p>
                      </div>
                    </div>

                    {mentee.grade && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500">Grade:</span>
                        <p className="text-sm font-medium text-slate-700">{mentee.grade}</p>
                      </div>
                    )}

                    {mentee.interests && mentee.interests.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-slate-500">Interests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mentee.interests.slice(0, 3).map((interest: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      Joined: {new Date(mentee.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg border-2 border-slate-200">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Mentees Registered Yet</h3>
                <p className="text-slate-600">Mentees will appear here once they sign up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Chat />
    </>
  );
}
