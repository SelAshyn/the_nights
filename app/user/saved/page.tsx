'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { UserNavbar } from '@/components/UserNavbar';
import { Chat } from '@/components/Chat';
import type { Career } from '../page';

export const dynamic = 'force-dynamic';

export default function SavedCareersPage() {
  const [loading, setLoading] = useState(true);
  const [savedCareerTitles, setSavedCareerTitles] = useState<string[]>([]);
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const userId = session.user.id;
        const userKey = (key: string) => `${key}_${userId}`;

        // Load saved career titles (user-specific)
        const saved = localStorage.getItem(userKey('savedCareers'));
        if (saved) {
          try {
            const titles = JSON.parse(saved);
            setSavedCareerTitles(titles);
            console.log('Loaded saved career titles:', titles);
          } catch (e) {
            console.warn('Invalid savedCareers in localStorage');
          }
        }

        // Load all careers from user-specific localStorage or database
        const careersData = localStorage.getItem(userKey('careerSuggestions'));
        if (careersData) {
          try {
            const careers = JSON.parse(careersData);
            setAllCareers(careers);
            console.log('Loaded careers from localStorage:', careers.length);
          } catch (e) {
            console.warn('Invalid careerSuggestions in localStorage');
          }
        } else {
          // Try to load from database
          console.log('No careers in localStorage, fetching from database...');
          await fetchCareersFromDatabase(session.access_token);
        }

        setLoading(false);
      } catch (err) {
        console.error('Auth or init error', err);
        setLoading(false);
      }
    };

    const fetchCareersFromDatabase = async (accessToken: string) => {
      try {
        const response = await fetch('/api/quiz/get', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const { careers } = await response.json();
          if (careers && careers.length > 0) {
            setAllCareers(careers);
            console.log('Loaded careers from database:', careers.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch careers from database:', err);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Listen for storage changes (when saved from another tab or page)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;
      const userKey = (key: string) => `${key}_${userId}`;

      if (e.key === userKey('savedCareers') && e.newValue) {
        try {
          setSavedCareerTitles(JSON.parse(e.newValue));
        } catch (err) {
          console.warn('Failed to parse savedCareers from storage event');
        }
      }
      if (e.key === userKey('careerSuggestions') && e.newValue) {
        try {
          setAllCareers(JSON.parse(e.newValue));
        } catch (err) {
          console.warn('Failed to parse careerSuggestions from storage event');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const removeSavedCareer = async (careerTitle: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const userKey = (key: string) => `${key}_${userId}`;

    const updated = savedCareerTitles.filter((title) => title !== careerTitle);
    setSavedCareerTitles(updated);
    localStorage.setItem(userKey('savedCareers'), JSON.stringify(updated));
  };

  const savedCareers = allCareers.filter((career) => savedCareerTitles.includes(career.title));

  console.log('Saved page state:', {
    savedCareerTitles,
    allCareersCount: allCareers.length,
    savedCareersCount: savedCareers.length
  });

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
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">⭐ Saved Careers</h1>
            <p className="text-slate-600 text-lg">Your bookmarked career paths for future reference</p>
          </div>

          {savedCareers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Saved Careers Yet</h2>
              <p className="text-slate-600 mb-6">Start exploring careers and save the ones you're interested in!</p>
              <Button onClick={() => router.push('/user')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Explore Careers
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {savedCareers.map((career, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-slate-900">{career.title}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Saved
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4">{career.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-slate-500">Salary Range</div>
                          <div className="font-semibold text-slate-900">{career.salary || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Growth Potential</div>
                          <div className="font-semibold text-slate-900">{career.growth || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Education</div>
                          <div className="font-semibold text-slate-900">{career.education || '—'}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-slate-500 mb-2">Key Skills</div>
                        <div className="flex flex-wrap gap-2">
                          {(career.skills || []).slice(0, 8).map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => router.push('/user')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          size="sm"
                        >
                          View Full Details
                        </Button>
                        <Button
                          onClick={() => removeSavedCareer(career.title)}
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:border-red-300"
                          size="sm"
                        >
                          🗑️ Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Chat />
    </div>
  );
}

