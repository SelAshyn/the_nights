'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserNavbar } from '@/components/UserNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

type SavedCareer = {
  id: string;
  user_id: string;
  career_title: string;
  career_description?: string;
  education?: string;
  field_of_study?: string;
  top_skills?: string[];
  certifications?: string[];
  possible_job_titles?: string[];
  universities?: string[];
  extracurriculars?: string[];
  financial_guidance?: string[];
  career_path?: string;
  salary_range?: string;
  growth_potential?: string;
  fit_score?: number;
  created_at: string;
};

export default function SavedPage() {
  const [loading, setLoading] = useState(true);
  const [savedCareers, setSavedCareers] = useState<SavedCareer[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      await fetchSavedCareers();
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchSavedCareers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Fetch saved careers for user
      const { data: saved, error: savedError } = await supabase
        .from('saved_careers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved careers:');
        console.error('Message:', savedError.message);
        console.error('Code:', savedError.code);
        console.error('Details:', savedError.details);
        console.error('Hint:', savedError.hint);
        return;
      }

      console.log('Saved careers loaded:', saved?.length || 0);
      setSavedCareers(saved || []);
    } catch (error: any) {
      console.error('Exception loading saved careers:', error?.message);
    }
  };

  const removeSaved = async (careerId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { error } = await supabase
        .from('saved_careers')
        .delete()
        .eq('id', careerId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error removing saved career:', error);
        return;
      }

      console.log('Career removed successfully');
      // Refresh list
      fetchSavedCareers();
    } catch (error) {
      console.error('Error removing saved career:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900 relative overflow-hidden">
      <UserNavbar />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="pt-28 pb-12 relative z-10 max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="text-xl">💼</span>
            Saved Careers
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Your Saved Career Paths
          </h1>
          <p className="text-slate-300 text-lg">
            Career options you've bookmarked for exploration
          </p>
        </div>

        {savedCareers.length === 0 ? (
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-12 border border-teal-500/20 text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Saved Careers Yet</h3>
            <p className="text-slate-400 mb-6">
              Start exploring career paths and save your favorites for easy access
            </p>
            <button
              onClick={() => router.push('/user')}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-teal-500/20"
            >
              Explore Careers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedCareers.map((career) => (
              <div
                key={career.id}
                className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 hover:border-teal-500/40 transition-all shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {career.career_title}
                      </h3>
                      {career.fit_score && (
                        <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {career.fit_score}
                        </span>
                      )}
                    </div>
                    {career.career_description && (
                      <p className="text-slate-300 text-sm mb-3">
                        {career.career_description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeSaved(career.id)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-4"
                    title="Remove from saved"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                {career.education && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wide">Education</span>
                    <p className="text-white font-semibold mt-1">{career.education}</p>
                    {career.field_of_study && (
                      <p className="text-slate-300 text-sm">{career.field_of_study}</p>
                    )}
                  </div>
                )}

                {career.top_skills && career.top_skills.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Top Skills</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {career.top_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {career.certifications && career.certifications.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Certifications</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {career.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {career.possible_job_titles && career.possible_job_titles.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Possible Job Titles</span>
                    <p className="text-slate-300 text-sm mt-1">{career.possible_job_titles.join(', ')}</p>
                  </div>
                )}

                {career.universities && career.universities.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Universities</span>
                    <p className="text-slate-300 text-sm mt-1">{career.universities.join(', ')}</p>
                  </div>
                )}

                {career.extracurriculars && career.extracurriculars.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Extracurriculars</span>
                    <p className="text-slate-300 text-sm mt-1">{career.extracurriculars.join(', ')}</p>
                  </div>
                )}

                {career.financial_guidance && career.financial_guidance.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Financial Guidance</span>
                    <p className="text-slate-300 text-sm mt-1">{career.financial_guidance.join(', ')}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                  {career.salary_range && (
                    <div>
                      <span className="text-xs text-slate-400">Estimated Salary</span>
                      <p className="text-sm font-semibold text-green-400">{career.salary_range}</p>
                    </div>
                  )}
                  {career.growth_potential && (
                    <div>
                      <span className="text-xs text-slate-400">Growth</span>
                      <p className="text-sm font-semibold text-purple-400">{career.growth_potential}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => router.push(`/user?career=${encodeURIComponent(career.career_title)}`)}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm shadow-lg shadow-teal-500/20"
                  >
                    Explore More
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Saved {new Date(career.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Chat />
    </div>
  );
}
