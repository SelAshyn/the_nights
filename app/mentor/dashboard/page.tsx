'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

export default function MentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState<any>(null);
  const [menteesData, setMenteesData] = useState<any>(null);
  const [loadingMentees, setLoadingMentees] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMentor = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/mentor');
        return;
      }

      setMentorData(session.user);

      // Check verification status
      const verificationStatus = session.user.user_metadata?.verification_status;
      if (verificationStatus === 'pending') {
        // Show pending verification message
        console.log('Mentor verification pending');
      }

      setLoading(false);
    };

    checkMentor();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth/mentor');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const response = await fetch('/api/mentees/active');
        const data = await response.json();
        setMenteesData(data);
      } catch (error) {
        console.error('Failed to fetch mentees:', error);
      } finally {
        setLoadingMentees(false);
      }
    };

    fetchMentees();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMentees, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  const verificationStatus = mentorData?.user_metadata?.verification_status || 'approved';

  return (
    <>
      <MentorNavbar />
      <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-purple-50 to-pink-50">

        {/* Verification Status Banner */}
        {verificationStatus === 'pending' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 lg:px-8 py-4">
            <div className="rounded-xl bg-yellow-50 p-4 border-2 border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800">Verification Pending</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your mentor application is under review. We're verifying your LinkedIn profile and professional background.
                    You'll receive an email notification once approved (typically within 24-48 hours).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="rounded-xl bg-red-50 p-4 border-2 border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Verification Not Approved</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Unfortunately, we couldn't verify your mentor credentials at this time. Please contact support for more information or resubmit your application with updated details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span className="text-xl">👨‍🏫</span>
              Mentor Dashboard
            </div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
              Welcome, {mentorData?.user_metadata?.full_name || 'Mentor'}!
            </h1>
            <p className="text-slate-600 font-body text-lg">
              {mentorData?.user_metadata?.profession && (
                <span className="font-semibold text-purple-600">{mentorData.user_metadata.profession}</span>
              )}
              {mentorData?.user_metadata?.experience && (
                <span> • {mentorData.user_metadata.experience} experience</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Mentees</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {loadingMentees ? '...' : menteesData?.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  🟢
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Now</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loadingMentees ? '...' : menteesData?.active || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <p className="text-sm text-slate-600">Messages</p>
                  <p className="text-3xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <div>
                  <p className="text-sm text-slate-600">Sessions</p>
                  <p className="text-3xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mentees List */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 mb-8">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
              Registered Mentees
            </h2>
            {loadingMentees ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              </div>
            ) : menteesData?.mentees && menteesData.mentees.length > 0 ? (
              <div className="space-y-3">
                {menteesData.mentees.map((mentee: any) => (
                  <div key={mentee.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {mentee.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{mentee.name}</h3>
                        <p className="text-sm text-slate-600">{mentee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {mentee.is_active && (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Active
                        </span>
                      )}
                      {mentee.last_sign_in && (
                        <span className="text-sm text-slate-500">
                          Last seen: {new Date(mentee.last_sign_in).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No mentees registered yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
              Getting Started as a Mentor
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Complete Your Profile</h3>
                  <p className="text-slate-600 text-sm">Add your expertise, availability, and areas you can mentor in</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Browse Mentee Requests</h3>
                  <p className="text-slate-600 text-sm">Find students who need guidance in your field</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Start Mentoring</h3>
                  <p className="text-slate-600 text-sm">Connect with mentees and schedule your first session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <Chat />
    </>
  );
}
