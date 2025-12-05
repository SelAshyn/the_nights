'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_name: string;
  user2_name: string;
  updated_at: string;
  last_message?: string;
  message_count?: number;
  unread_count?: number;
};

export default function MentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
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
    const fetchConversations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get all conversations for this mentor
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('id, user1_id, user2_id, updated_at')
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
          .order('updated_at', { ascending: false });

        if (convError) {
          console.error('Error fetching conversations:', convError.message || convError);
          setConversations([]);
          setLoadingConversations(false);
          return;
        }

        if (!convData || convData.length === 0) {
          setConversations([]);
          setLoadingConversations(false);
          return;
        }

        // For each conversation, get the last message, counts, and actual names from profiles
        const conversationsWithMessages = await Promise.all(
          convData.map(async (conv) => {
            try {
              // Determine the other user's ID
              const otherUserId = conv.user1_id === session.user.id ? conv.user2_id : conv.user1_id;

              // Fetch the other user's profile to get their actual name
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', otherUserId)
                .single();

              const otherUserName = profile?.full_name || profile?.email || 'User';

              // Get last message
              const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              // Get total message count
              const { count: totalMessages } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);

              // Get unread count
              const { count: unreadMessages } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('is_read', false)
                .neq('sender_id', session.user.id);

              return {
                ...conv,
                user1_name: conv.user1_id === session.user.id ? 'You' : otherUserName,
                user2_name: conv.user2_id === session.user.id ? 'You' : otherUserName,
                last_message: lastMsg?.content || 'No messages yet',
                message_count: totalMessages || 0,
                unread_count: unreadMessages || 0
              };
            } catch (convError: any) {
              console.error('Error processing conversation:', convError?.message || convError);
              return {
                ...conv,
                user1_name: 'User',
                user2_name: 'User',
                last_message: 'Error loading messages',
                message_count: 0,
                unread_count: 0
              };
            }
          })
        );

        setConversations(conversationsWithMessages);
      } catch (error: any) {
        console.error('Failed to fetch conversations:', error?.message || error || 'Unknown error');
      } finally {
        setLoadingConversations(false);
      }
    };

    if (mentorData) {
      fetchConversations();
      // Refresh every 10 seconds
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [mentorData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
      </div>
    );
  }

  const verificationStatus = mentorData?.user_metadata?.verification_status || 'approved';

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
    <>
      <MentorNavbar />
      <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Verification Status Banner */}
        {verificationStatus === 'pending' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 lg:px-8 py-4 relative z-10">
            <div className="rounded-xl bg-yellow-500/10 backdrop-blur-sm p-4 border-2 border-yellow-500/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-yellow-300">Verification Pending</h3>
                  <p className="mt-1 text-sm text-yellow-200">
                    Your mentor application is under review. We're verifying your LinkedIn profile and professional background.
                    You'll receive an email notification once approved (typically within 24-48 hours).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
            <div className="rounded-xl bg-red-500/10 backdrop-blur-sm p-4 border-2 border-red-500/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-red-300">Verification Not Approved</h3>
                  <p className="mt-1 text-sm text-red-200">
                    Unfortunately, we couldn't verify your mentor credentials at this time. Please contact support for more information or resubmit your application with updated details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span className="text-xl">👨‍🏫</span>
              Mentor Dashboard
            </div>
            <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Welcome, {mentorData?.user_metadata?.full_name || 'Mentor'}!
            </h1>
            <p className="text-slate-300 font-body text-lg">
              {mentorData?.user_metadata?.profession && (
                <span className="font-semibold text-teal-400">{mentorData.user_metadata.profession}</span>
              )}
              {mentorData?.user_metadata?.experience && (
                <span> • {mentorData.user_metadata.experience} experience</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-teal-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active Mentees</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingConversations ? '...' : conversations.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-cyan-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Messages</p>
                  <p className="text-3xl font-bold text-white">
                    {loadingConversations ? '...' : conversations.reduce((sum, conv) => sum + (conv.message_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-purple-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-2xl">
                  📩
                </div>
                <div>
                  <p className="text-sm text-slate-400">Unread</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {loadingConversations ? '...' : conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mentees You're Helping */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-teal-500/20 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                💬 Mentees You're Helping
              </h2>
              <span className="text-sm text-slate-400">
                {conversations.length} active mentee{conversations.length !== 1 ? 's' : ''}
              </span>
            </div>
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {conversations.map((conv) => {
                  const otherUserId = conv.user1_id === mentorData?.id ? conv.user2_id : conv.user1_id;
                  const otherUserName = conv.user1_id === mentorData?.id ? conv.user2_name : conv.user1_name;
                  const initials = otherUserName ? otherUserName.substring(0, 2).toUpperCase() : 'ME';
                  const timeAgo = getTimeAgo(conv.updated_at);

                  return (
                    <div
                      key={conv.id}
                      className="group relative p-5 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-teal-500/30 hover:border-teal-500/60 hover:bg-slate-700/70 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/30">
                            {initials}
                          </div>
                          {conv.unread_count && conv.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white text-lg truncate">
                              {otherUserName || 'Mentee'}
                            </h3>
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                            {conv.last_message}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/mentor/mentees/${otherUserId}`);
                              }}
                              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              View Progress
                            </button>
                            <span className="flex items-center gap-1 text-xs text-teal-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Open Chat
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-lg mb-2">No active mentees yet</p>
                <p className="text-slate-500 text-sm">When you start helping mentees, they'll appear here</p>
              </div>
            )}
          </div>

          {/* Getting Started */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-teal-500/20">
            <h2 className="text-2xl font-heading font-bold text-white mb-4">
              Getting Started as a Mentor
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-teal-500/10 backdrop-blur-sm rounded-xl border border-teal-500/30">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-white">Complete Your Profile</h3>
                  <p className="text-slate-300 text-sm">Add your expertise, availability, and areas you can mentor in</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-semibold text-white">Browse Mentee Requests</h3>
                  <p className="text-slate-300 text-sm">Find students who need guidance in your field</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="font-semibold text-white">Start Mentoring</h3>
                  <p className="text-slate-300 text-sm">Connect with mentees and schedule your first session</p>
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
