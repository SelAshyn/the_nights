'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

type Milestone = {
  id: number;
  title: string;
  status: string;
  progress: number;
};

type ScheduleSlot = {
  id: string;
  day: string;
  time: string;
  activity: string;
  color: string;
};

type Mentee = {
  id: string;
  full_name: string;
  email: string;
  grade?: string;
  interests?: string[];
  created_at: string;
  milestones: Milestone[];
  scheduleSlots: ScheduleSlot[];
  lastMessage?: string;
  conversationUpdated?: string;
};

export default function MenteesPage() {
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const router = useRouter();

  const fetchMentees = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/mentor');
        return;
      }

      console.log('🔍 Fetching data for mentor:', session.user.id);

      // Step 1: Get all conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false });

      console.log('💬 Conversations:', conversations?.length || 0, conversations);

      if (convError) {
        console.error('❌ Error fetching conversations:', convError);
        alert('Error loading conversations. Check console for details.');
        setMentees([]);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('⚠️ No conversations found');
        setMentees([]);
        return;
      }

      // Step 2: Extract mentee IDs
      const menteeIds = conversations.map(conv =>
        conv.user1_id === session.user.id ? conv.user2_id : conv.user1_id
      );

      // Step 3: Fetch all data in parallel
      const [profilesResult, milestonesResult, schedulesResult, messagesResult] = await Promise.all([
        // Get profiles
        supabase
          .from('profiles')
          .select('*')
          .in('id', menteeIds),

        // Get all milestones for these mentees
        supabase
          .from('milestones')
          .select('*')
          .in('user_id', menteeIds),

        // Get all schedules for these mentees
        supabase
          .from('study_schedules')
          .select('*')
          .in('user_id', menteeIds),

        // Get last messages
        Promise.all(
          conversations.map(async (conv) => {
            const { data } = await supabase
              .from('messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            return { convId: conv.id, message: data?.content };
          })
        )
      ]);

      console.log('📊 Profiles:', profilesResult.data?.length || 0, profilesResult.error);
      console.log('🎯 Milestones:', milestonesResult.data?.length || 0, milestonesResult.error);
      console.log('📅 Schedules:', schedulesResult.data?.length || 0, schedulesResult.error);

      if (profilesResult.error) {
        console.error('❌ Profiles error:', profilesResult.error);
        alert('Cannot load profiles. Did you run RUN-THIS-NOW.sql in Supabase?');
      }

      // Step 4: Combine all data
      const menteesData: Mentee[] = (profilesResult.data || [])
        .filter(profile => profile.id !== session.user.id) // Don't show yourself
        .map(profile => {
          const conv = conversations.find(c =>
            c.user1_id === profile.id || c.user2_id === profile.id
          );

          const menteeMilestones = (milestonesResult.data || []).filter(
            m => m.user_id === profile.id
          );

          const schedule = (schedulesResult.data || []).find(
            s => s.user_id === profile.id
          );

          const lastMsg = messagesResult.find(m => m.convId === conv?.id);

          return {
            id: profile.id,
            full_name: profile.full_name || 'Unknown',
            email: profile.email || '',
            grade: profile.grade,
            interests: profile.interests || [],
            created_at: profile.created_at,
            milestones: menteeMilestones,
            scheduleSlots: schedule?.slots || [],
            lastMessage: lastMsg?.message || 'No messages yet',
            conversationUpdated: conv?.updated_at
          };
        });

      console.log('✅ Final mentees data:', menteesData.length, menteesData);
      setMentees(menteesData);
    } catch (error) {
      console.error('❌ Error in fetchMentees:', error);
      alert('Error loading mentees. Check browser console (F12) for details.');
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMentees, 30000);

    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      <MentorNavbar />
      <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  👥 My Mentees
                </h1>
                <p className="text-slate-300 text-lg">
                  {mentees.length} {mentees.length === 1 ? 'mentee' : 'mentees'} you're helping
                </p>
              </div>
              <button
                onClick={fetchMentees}
                className="text-teal-400 hover:text-teal-300 text-sm font-semibold transition-colors flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-teal-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Mentees List */}
          {mentees.length > 0 ? (
            <div className="space-y-4">
              {mentees.map((mentee) => {
                const completedMilestones = mentee.milestones.filter(m => m.status === 'completed').length;
                const avgProgress = mentee.milestones.length > 0
                  ? Math.round(mentee.milestones.reduce((sum, m) => sum + m.progress, 0) / mentee.milestones.length)
                  : 0;

                // Get unique days and times from schedule
                const scheduleDays = Array.from(new Set(mentee.scheduleSlots.map(s => s.day)));
                const scheduleTimes = Array.from(new Set(mentee.scheduleSlots.map(s => s.time))).sort();
                const hasSchedule = mentee.scheduleSlots.length > 0;

                return (
                  <div key={mentee.id} className="bg-slate-800/90 rounded-2xl shadow-2xl border border-teal-500/30 overflow-hidden">
                    {/* Mentee Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                            {mentee.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{mentee.full_name}</h3>
                            <p className="text-sm text-slate-400">{mentee.email}</p>
                            {mentee.grade && (
                              <p className="text-xs text-slate-500 mt-1">Grade: {mentee.grade}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/mentor/mentees/${mentee.id}`)}
                          size="sm"
                        >
                          View Full Schedule
                        </Button>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-teal-500/20">
                          <div className="text-xs text-slate-400 mb-1">Milestones</div>
                          <div className="text-2xl font-bold text-white">{mentee.milestones.length}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-green-500/20">
                          <div className="text-xs text-slate-400 mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-400">{completedMilestones}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-cyan-500/20">
                          <div className="text-xs text-slate-400 mb-1">Avg Progress</div>
                          <div className="text-2xl font-bold text-cyan-400">{avgProgress}%</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-purple-500/20">
                          <div className="text-xs text-slate-400 mb-1">Schedule Slots</div>
                          <div className="text-2xl font-bold text-white">{mentee.scheduleSlots.length}</div>
                        </div>
                      </div>

                      {/* Weekly Schedule Preview */}
                      {hasSchedule && (
                        <div className="mb-4">
                          <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            📅 Weekly Schedule
                            <span className="text-xs text-slate-400 font-normal">
                              ({scheduleDays.length} days, {scheduleTimes.length} time slots)
                            </span>
                          </h4>
         <div className="bg-slate-700/30 rounded-xl p-4 border border-cyan-500/20">
                            <div className="grid grid-cols-7 gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                const fullDay = {
                                  'Mon': 'Monday',
                                  'Tue': 'Tuesday',
                                  'Wed': 'Wednesday',
                                  'Thu': 'Thursday',
                                  'Fri': 'Friday',
                                  'Sat': 'Saturday',
                                  'Sun': 'Sunday'
                                }[day];
                                const daySlots = mentee.scheduleSlots.filter(s => s.day === fullDay);
                                const hasActivity = daySlots.length > 0;

                                return (
                                  <div key={day} className="text-center">
                                    <div className="text-xs text-slate-400 mb-1">{day}</div>
                                    <div className={`h-12 rounded-lg flex items-center justify-center text-xs font-semibold ${
                                      hasActivity
                                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                        : 'bg-slate-600/20 text-slate-500 border border-slate-600/30'
                                    }`}>
                                      {hasActivity ? daySlots.length : '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {mentee.scheduleSlots.slice(0, 5).map((slot, idx) => (
                                <div key={idx} className={`${slot.color} text-white text-xs px-2 py-1 rounded`}>
                                  {slot.activity}
                                </div>
                              ))}
                              {mentee.scheduleSlots.length > 5 && (
                                <div className="bg-slate-600/50 text-slate-300 text-xs px-2 py-1 rounded">
                                  +{mentee.scheduleSlots.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Milestone Progress - Always Visible */}
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                          🎯 Milestone Progress
                          {mentee.milestones.length > 0 && (
                            <span className="text-xs text-slate-400 font-normal">
                              ({completedMilestones}/{mentee.milestones.length} completed)
                            </span>
                          )}
                        </h4>
                        {mentee.milestones.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mentee.milestones.map((milestone) => (
                              <div key={milestone.id} className="bg-slate-700/30 rounded-xl p-4 border border-teal-500/20">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-white text-sm flex-1">{milestone.title}</h5>
                                  <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ml-2 ${
                                    milestone.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    milestone.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                  }`}>
                                    {milestone.status === 'not-started' ? 'Not Started' :
                                     milestone.status === 'in-progress' ? 'In Progress' :
                                     'Completed'}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span className="text-teal-400 font-semibold">{milestone.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-600/50 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-2 bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-300"
                                      style={{ width: `${milestone.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-slate-700/20 rounded-lg border border-slate-600/30">
                            <p className="text-sm text-slate-400">No milestones created yet</p>
                          </div>
                        )}
                      </div>

                      {/* Last Message */}
                      <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                        <div className="text-xs text-slate-500 mb-1">💬 Last Message</div>
                        <p className="text-sm text-slate-300 line-clamp-1">{mentee.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-800/90 rounded-2xl p-12 text-center shadow-2xl border border-teal-500/20">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">No Active Mentees Yet</h3>
              <p className="text-slate-400 mb-4">Start conversations with mentees to see them here!</p>
              <Button onClick={() => router.push('/mentor/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      <Chat />
    </>
  );
}
