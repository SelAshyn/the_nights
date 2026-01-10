'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MentorNavbar } from '@/components/MentorNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

type ScheduleSlot = {
  id: string;
  time: string;
  activity: string;
  color: string;
};

type Milestone = {
  id: number;
  title: string;
  status: string;
  progress: number;
};

export default function MenteeProgressPage() {
  const params = useParams();
  const router = useRouter();
  const menteeId = params.menteeId as string;

  const [loading, setLoading] = useState(true);
  const [menteeData, setMenteeData] = useState<any>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const activityColors: { [key: string]: string } = {
    'Study Session': 'bg-teal-500/80',
    'Assignment Work': 'bg-blue-500/80',
    'Project Time': 'bg-purple-500/80',
    'Reading': 'bg-green-500/80',
    'Practice Problems': 'bg-yellow-500/80',
    'Group Study': 'bg-pink-500/80',
    'Break': 'bg-gray-500/80',
    'Review': 'bg-cyan-500/80'
  };

  useEffect(() => {
    const fetchMenteeData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/mentor');
          return;
        }

        // Fetch mentee profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', menteeId)
          .single();

        if (profileError) throw profileError;
        setMenteeData(profile);

        // Fetch schedule
        const { data: schedule, error: scheduleError } = await supabase
          .from('study_schedules')
          .select('*')
          .eq('user_id', menteeId)
          .single();

        if (!scheduleError && schedule && schedule.slots) {
          setScheduleSlots(schedule.slots);

          // Extract unique time slots
          const uniqueTimes = Array.from(new Set(schedule.slots.map((s: ScheduleSlot) => s.time)));
          setTimeSlots(uniqueTimes.sort());
        }

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .eq('user_id', menteeId)
          .order('id');

        if (!milestonesError && milestonesData) {
          setMilestones(milestonesData);
        }

      } catch (error) {
        console.error('Error fetching mentee data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenteeData();
  }, [menteeId, router]);

  const getSlot = (day: string, time: string) => {
    return scheduleSlots.find(s => s.id === `${day}-${time}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
      </div>
    );
  }

  if (!menteeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <MentorNavbar />
        <div className="pt-28 pb-12 max-w-7xl mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Mentee Not Found</h1>
            <button
              onClick={() => router.push('/mentor/dashboard')}
              className="text-teal-400 hover:text-teal-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
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

        <div className="max-w-[95%] mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/mentor/dashboard')}
              className="text-teal-400 hover:text-teal-300 mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                {menteeData.full_name?.substring(0, 2).toUpperCase() || 'ME'}
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {menteeData.full_name || 'Mentee'}'s Progress
                </h1>
                <p className="text-slate-300">{menteeData.email}</p>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-teal-500/20 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">📅 Weekly Schedule</h2>

            {scheduleSlots.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-white font-semibold p-2 border-b border-slate-600 sticky left-0 bg-slate-800/90 z-10">Time</th>
                      {days.map(day => (
                        <th key={day} className="text-center text-white font-semibold p-2 border-b border-slate-600 min-w-[120px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time}>
                        <td className="text-slate-300 text-sm p-2 border-b border-slate-600/50 font-medium sticky left-0 bg-slate-800/90 z-10">
                          {time}
                        </td>
                        {days.map(day => {
                          const slot = getSlot(day, time);
                          return (
                            <td
                              key={`${day}-${time}`}
                              className="border border-slate-600/50 p-1"
                            >
                              {slot ? (
                                <div className={`${slot.color} text-white text-xs p-2 rounded`}>
                                  <div className="font-semibold truncate">{slot.activity}</div>
                                </div>
                              ) : (
                                <div className="h-14 flex items-center justify-center text-slate-600 text-xs">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No schedule created yet</p>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-teal-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">🎯 Milestone Progress</h2>

            {milestones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestones.map(m => (
                  <div key={m.id} className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30">
                    <div className="mb-2">
                      <h4 className="font-semibold text-white">{m.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Status: <span className={`font-semibold ${
                          m.status === 'completed' ? 'text-green-400' :
                          m.status === 'in-progress' ? 'text-yellow-400' :
                          'text-slate-400'
                        }`}>
                          {m.status === 'not-started' ? 'Not Started' :
                           m.status === 'in-progress' ? 'In Progress' :
                           'Completed'}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className='flex justify-between text-xs text-slate-400 mb-1'>
                        <span>Progress</span>
                        <span className='text-teal-400 font-semibold'>{m.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-300"
                          style={{ width: `${m.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No milestones created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Chat />
    </>
  );
}
