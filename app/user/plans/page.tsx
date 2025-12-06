'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { UserNavbar } from '@/components/UserNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

//----------------------------------------
// Types
//----------------------------------------
type ScheduleSlot = {
  id: string;
  day: string;
  time: string;
  activity: string;
  color: string;
};

type Milestone = {
  id: number;
  user_id?: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  target_date?: string;
  created_at?: string;
};

//----------------------------------------
// Study Schedules Component
//----------------------------------------
function StudySchedules() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'
  ]);

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [availableActivities, setAvailableActivities] = useState<string[]>([
    'Study Session',
    'Assignment Work',
    'Project Time',
    'Reading',
    'Practice Problems',
    'Group Study',
    'Break',
    'Review'
  ]);
  const [newActivity, setNewActivity] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [newTimeHour, setNewTimeHour] = useState('12');
  const [newTimeMinute, setNewTimeMinute] = useState('00');
  const [newTimePeriod, setNewTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [editTimeHour, setEditTimeHour] = useState('');
  const [editTimeMinute, setEditTimeMinute] = useState('');
  const [editTimePeriod, setEditTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

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

  const fetchSchedule = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return;
      }

      console.log('Fetching schedule for user:', session.user.id);
      const { data, error } = await supabase
        .from('study_schedules')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.log('Error fetching schedule:', error);
        if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Fetch error:', error);
        }
      } else if (data && data.slots) {
        console.log('Schedule loaded:', data.slots.length, 'slots');
        setScheduleSlots(data.slots);
      }
    } catch (err) {
      console.error('Exception fetching schedule:', err);
    }
  };

  const saveSchedule = async (slots: ScheduleSlot[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Cannot save: No session');
        return;
      }

      console.log('Saving schedule with', slots.length, 'slots for user:', session.user.id);

      const { data: existing, error: checkError } = await supabase
        .from('study_schedules')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing schedule:', checkError);
      }

      if (existing) {
        console.log('Updating existing schedule');
        const { error: updateError } = await supabase
          .from('study_schedules')
          .update({ slots, updated_at: new Date().toISOString() })
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error('Error updating schedule:', updateError.message || updateError);
        } else {
          console.log('Schedule updated successfully');
        }
      } else {
        console.log('Creating new schedule');
        const { error: insertError } = await supabase
          .from('study_schedules')
          .insert([{ user_id: session.user.id, slots }]);

        if (insertError) {
          console.error('Error inserting schedule:', insertError.message || insertError);
        } else {
          console.log('Schedule created successfully');
        }
      }
    } catch (err: any) {
      console.error('Exception saving schedule:', err?.message || err || 'Unknown error');
    }
  };

  const handleDragStart = (activity: string) => {
    setDraggedItem(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: string, time: string) => {
    if (!draggedItem) return;

    const slotId = `${day}-${time}`;
    const existingSlotIndex = scheduleSlots.findIndex(s => s.id === slotId);

    const newSlot: ScheduleSlot = {
      id: slotId,
      day,
      time,
      activity: draggedItem,
      color: activityColors[draggedItem] || 'bg-slate-500/80'
    };

    let updatedSlots;
    if (existingSlotIndex >= 0) {
      updatedSlots = [...scheduleSlots];
      updatedSlots[existingSlotIndex] = newSlot;
    } else {
      updatedSlots = [...scheduleSlots, newSlot];
    }

    setScheduleSlots(updatedSlots);
    saveSchedule(updatedSlots);
    setDraggedItem(null);
  };

  const clearSlot = (slotId: string) => {
    const updatedSlots = scheduleSlots.filter(s => s.id !== slotId);
    setScheduleSlots(updatedSlots);
    saveSchedule(updatedSlots);
  };

  const addActivity = () => {
    if (newActivity.trim() && !availableActivities.includes(newActivity.trim())) {
      setAvailableActivities([...availableActivities, newActivity.trim()]);
      setNewActivity('');
      setShowAddActivity(false);
    }
  };

  const sortTimeSlots = (slots: string[]) => {
    return slots.sort((a, b) => {
      const parseTime = (time: string) => {
        const [timePart, period] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a) - parseTime(b);
    });
  };

  const addTimeSlot = () => {
    const newTime = `${newTimeHour}:${newTimeMinute} ${newTimePeriod}`;
    if (!timeSlots.includes(newTime)) {
      const updatedSlots = sortTimeSlots([...timeSlots, newTime]);
      setTimeSlots(updatedSlots);
      setNewTimeHour('12');
      setNewTimeMinute('00');
      setNewTimePeriod('AM');
      setShowAddTime(false);
    }
  };

  const startEditTime = (time: string) => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    setEditTimeHour(hours);
    setEditTimeMinute(minutes);
    setEditTimePeriod(period as 'AM' | 'PM');
    setEditingTime(time);
  };

  const saveEditTime = (oldTime: string) => {
    const newTime = `${editTimeHour}:${editTimeMinute} ${editTimePeriod}`;
    if (newTime !== oldTime && !timeSlots.includes(newTime)) {
      const updatedTimeSlots = timeSlots.map(t => t === oldTime ? newTime : t);
      setTimeSlots(sortTimeSlots(updatedTimeSlots));

      // Update schedule slots with new time
      const updatedScheduleSlots = scheduleSlots.map(slot => {
        if (slot.time === oldTime) {
          return { ...slot, time: newTime, id: `${slot.day}-${newTime}` };
        }
        return slot;
      });
      setScheduleSlots(updatedScheduleSlots);
      saveSchedule(updatedScheduleSlots);
    }
    setEditingTime(null);
  };

  const removeTimeSlot = (time: string) => {
    if (confirm(`Remove ${time} time slot? This will delete all activities scheduled at this time.`)) {
      setTimeSlots(timeSlots.filter(t => t !== time));
      const updatedSlots = scheduleSlots.filter(s => s.time !== time);
      setScheduleSlots(updatedSlots);
      saveSchedule(updatedSlots);
    }
  };

  const getSlot = (day: string, time: string) => {
    return scheduleSlots.find(s => s.id === `${day}-${time}`);
  };

  const generateAISchedule = async () => {
    try {
      setGeneratingSchedule(true);
      setScheduleMessage(null);

      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setScheduleMessage('Error: Not authenticated');
        return;
      }

      // Get quiz data from localStorage
      const userKey = (key: string) => `user-${session.user.id}-${key}`;
      const quizDataRaw = localStorage.getItem(userKey('fullQuizData'));
      if (!quizDataRaw) {
        setScheduleMessage('Error: Please complete the quiz first to generate a personalized schedule');
        return;
      }

      const quizData = JSON.parse(quizDataRaw);
      console.log('Generating AI schedule with quiz data:', quizData);

      // Call the AI schedule generation API
      const response = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          quiz: quizData,
          currentSchedule: scheduleSlots
        })
      });

      if (!response.ok) {
        const error = await response.json();
        setScheduleMessage(`Error: ${error.error || 'Failed to generate schedule'}`);
        return;
      }

      const result = await response.json();
      if (result.success && result.schedule) {
        // Replace current schedule with AI-generated one
        setScheduleSlots(result.schedule);
        await saveSchedule(result.schedule);
        setScheduleMessage(
          result.source === 'ai'
            ? '✅ AI schedule generated successfully! Review and customize as needed.'
            : '✅ Schedule generated with defaults. Customize to your preferences.'
        );

        // Clear message after 5 seconds
        setTimeout(() => setScheduleMessage(null), 5000);
      } else {
        setScheduleMessage('Error: Failed to generate schedule');
      }
    } catch (error: any) {
      console.error('Error generating AI schedule:', error);
      setScheduleMessage(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">📅 Weekly Schedule</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={generateAISchedule}
            disabled={generatingSchedule}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all"
            title="Generate an optimized schedule based on your quiz answers"
          >
            {generatingSchedule ? '🔄 Generating...' : '✨ AI Schedule'}
          </button>
          <button
            onClick={() => {
              setShowAddTime(!showAddTime);
              setShowAddActivity(false);
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
          >
            {showAddTime ? '✕ Cancel' : '+ Add Time'}
          </button>
          <button
            onClick={() => {
              setShowAddActivity(!showAddActivity);
              setShowAddTime(false);
            }}
            className="text-teal-400 hover:text-teal-300 text-sm font-semibold transition-colors"
          >
            {showAddActivity ? '✕ Cancel' : '+ Add Activity'}
          </button>
        </div>
      </div>

      {/* Schedule generation message */}
      {scheduleMessage && (
        <div className={`p-3 rounded-lg border ${
          scheduleMessage.includes('✅')
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {scheduleMessage}
        </div>
      )}

      {/* Add Custom Time Slot */}
      {showAddTime && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center">
              <select
                value={newTimeHour}
                onChange={(e) => setNewTimeHour(e.target.value)}
                className="px-3 py-2 bg-slate-600/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = (i + 1).toString().padStart(2, '0');
                  return <option key={hour} value={hour}>{hour}</option>;
                })}
              </select>
              <span className="text-white font-bold">:</span>
              <select
                value={newTimeMinute}
                onChange={(e) => setNewTimeMinute(e.target.value)}
                className="px-3 py-2 bg-slate-600/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {['00', '15', '30', '45'].map(min => (
                  <option key={min} value={min}>{min}</option>
                ))}
              </select>
              <select
                value={newTimePeriod}
                onChange={(e) => setNewTimePeriod(e.target.value as 'AM' | 'PM')}
                className="px-3 py-2 bg-slate-600/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            <Button onClick={addTimeSlot}>Add Time</Button>
            <Button variant="outline" onClick={() => setShowAddTime(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Add Custom Activity */}
      {showAddActivity && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30 flex gap-2">
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Enter activity name"
            className="flex-1 px-3 py-2 bg-slate-600/50 border border-teal-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === 'Enter' && addActivity()}
          />
          <Button onClick={addActivity}>Add</Button>
        </div>
      )}

      {/* Available Activities */}
      <div className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30">
        <h4 className="text-sm font-semibold text-white mb-3">📋 Drag Activities to Schedule</h4>
        <div className="flex flex-wrap gap-2">
          {availableActivities.map((activity) => (
            <div
              key={activity}
              draggable
              onDragStart={() => handleDragStart(activity)}
              className={`${activityColors[activity] || 'bg-slate-500/80'} text-white px-3 py-2 rounded-lg text-sm font-semibold cursor-move hover:opacity-80 transition-opacity`}
            >
              {activity}
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-white font-semibold p-2 border-b border-slate-600 sticky left-0 bg-slate-700/90 z-10">Time</th>
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
                <td className="text-slate-300 text-sm p-2 border-b border-slate-600/50 font-medium sticky left-0 bg-slate-700/90 z-10">
                  {editingTime === time ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editTimeHour}
                        onChange={(e) => setEditTimeHour(e.target.value)}
                        className="px-2 py-1 bg-slate-600/50 border border-cyan-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = (i + 1).toString().padStart(2, '0');
                          return <option key={hour} value={hour}>{hour}</option>;
                        })}
                      </select>
                      <span className="text-white">:</span>
                      <select
                        value={editTimeMinute}
                        onChange={(e) => setEditTimeMinute(e.target.value)}
                        className="px-2 py-1 bg-slate-600/50 border border-cyan-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {['00', '15', '30', '45'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                      <select
                        value={editTimePeriod}
                        onChange={(e) => setEditTimePeriod(e.target.value as 'AM' | 'PM')}
                        className="px-2 py-1 bg-slate-600/50 border border-cyan-500/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <button
                        onClick={() => saveEditTime(time)}
                        className="text-green-400 hover:text-green-300 text-xs ml-1"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingTime(null)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <span>{time}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditTime(time)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs"
                          title="Edit time"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => removeTimeSlot(time)}
                          className="text-red-400 hover:text-red-300 text-xs"
                          title="Remove time slot"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                {days.map(day => {
                  const slot = getSlot(day, time);
                  return (
                    <td
                      key={`${day}-${time}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(day, time)}
                      className="border border-slate-600/50 p-1 hover:bg-slate-600/30 transition-colors"
                    >
                      {slot ? (
                        <div className={`${slot.color} text-white text-xs p-2 rounded relative group`}>
                          <div className="font-semibold truncate">{slot.activity}</div>
                          <button
                            onClick={() => clearSlot(slot.id)}
                            className="absolute top-0 right-0 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="h-14 flex items-center justify-center text-slate-500 text-xs">
                          Drop here
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

      {/* Instructions */}
      <div className="bg-teal-500/10 rounded-xl p-3 border border-teal-500/30">
        <p className="text-teal-300 text-sm">
          💡 <strong>Tip:</strong> Drag activities from above and drop them into time slots to build your schedule!
        </p>
      </div>
    </div>
  );
}

//----------------------------------------
// Milestones Component
//----------------------------------------
function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    status: 'not-started'
  });

  const fetchMilestones = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id');

      if (error) {
        console.error('Error fetching milestones:', error.message || error);
        setMilestones([]);
      } else {
        setMilestones(data || []);
      }
    } catch (err: any) {
      console.error('Exception fetching milestones:', err?.message || err);
      setMilestones([]);
    }
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const { error } = await supabase.from('milestones').insert([
        {
          user_id: session.user.id,
          title: formData.title,
          status: formData.status,
          progress: 0
        }
      ]);

      if (error) {
        console.error('Error adding milestone:', error.message || error);
        return;
      }

      setFormData({ title: '', status: 'not-started' });
      setShowForm(false);
      fetchMilestones();
    } catch (err: any) {
      console.error('Exception adding milestone:', err?.message || err);
    }
  };

  const updateProgress = async (id: number, progress: number) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ progress })
        .eq('id', id);

      if (error) {
        console.error('Error updating progress:', error.message || error);
      } else {
        fetchMilestones();
      }
    } catch (err: any) {
      console.error('Exception updating progress:', err?.message || err);
    }
  };

  const deleteMilestone = async (id: number) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting milestone:', error.message || error);
      } else {
        fetchMilestones();
      }
    } catch (err: any) {
      console.error('Exception deleting milestone:', err?.message || err);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">🎯 Milestone Tracking</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-teal-400 hover:text-teal-300 text-sm font-semibold transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Milestone Form */}
      {showForm && (
        <form onSubmit={addMilestone} className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Milestone Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete React Course"
              className="w-full px-3 py-2 bg-slate-600/50 border border-teal-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-600/50 border border-teal-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">Create Milestone</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setFormData({ title: '', status: 'not-started' });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Milestones List */}
      {milestones.map(m => (
        <div key={m.id} className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30">
          <div className="flex items-start justify-between mb-2">
            <div>
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
            <button
              onClick={() => deleteMilestone(m.id)}
              className="text-red-400 hover:text-red-300 text-xs transition-colors"
            >
              Delete
            </button>
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
            <div className='mt-3 flex gap-2'>
              <Button
                size="sm"
                onClick={() => updateProgress(m.id, Math.min(m.progress + 10, 100))}
                disabled={m.progress >= 100}
              >
                +10%
              </Button>
              <Button
                size="sm"
                variant='outline'
                onClick={() => updateProgress(m.id, Math.max(m.progress - 10, 0))}
                disabled={m.progress <= 0}
              >
                -10%
              </Button>
              <Button
                size="sm"
                variant='outline'
                onClick={() => updateProgress(m.id, 0)}
                disabled={m.progress === 0}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {!showForm && milestones.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No milestones yet. Click "+ Add" to create one!</p>
        </div>
      )}
    </div>
  );
}

//----------------------------------------
// Main Page
//----------------------------------------
export default function MyPlansPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth');
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) return <div className='text-white'>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900 relative overflow-hidden">
      <UserNavbar />

      <div className="pt-28 pb-12 relative z-10 max-w-[95%] mx-auto px-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-8">📚 My Learning Plans</h1>

        {/* Schedule - Full Width */}
        <div className="bg-slate-800/90 rounded-2xl p-6 border border-teal-500/20 mb-6">
          <StudySchedules />
        </div>

        {/* Milestones and Analytics - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-teal-500/20"><Milestones /></div>
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-teal-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Analytics</h3>
            <p className="text-slate-400 text-sm">Coming Soon</p>
          </div>
        </div>
      </div>

      <Chat />
    </div>
  );
}
function from(arg0: string) {
  throw new Error('Function not implemented.');
}

