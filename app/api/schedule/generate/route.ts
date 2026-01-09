import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface ScheduleSlot {
  id: string;
  day: string;
  time: string;
  activity: string;
  color: string;
}

interface QuizData {
  grade?: string;
  careerInterest?: string;
  academicInterests?: string[];
  academicStrengths?: string[];
  preferredEnvironment?: string;
  taskPreference?: string;
  skills?: string[];
  techConfidence?: string;
  workLife?: string;
  careerMotivation?: string;
  studyGoal?: string;
}

interface GenerateScheduleRequest {
  quiz: QuizData;
  currentSchedule?: ScheduleSlot[];
}

// Activity colors mapping
const activityColors: { [key: string]: string } = {
  'Study Session': 'bg-teal-500/80',
  'Assignment Work': 'bg-blue-500/80',
  'Project Time': 'bg-purple-500/80',
  'Reading': 'bg-green-500/80',
  'Practice Problems': 'bg-yellow-500/80',
  'Group Study': 'bg-pink-500/80',
  'Break': 'bg-gray-500/80',
  'Review': 'bg-cyan-500/80',
  'Coding Practice': 'bg-orange-500/80',
  'Math Problems': 'bg-red-500/80',
  'Language Learning': 'bg-indigo-500/80',
  'Science Lab': 'bg-emerald-500/80',
  'Mock Tests': 'bg-amber-500/80',
  'Mentorship': 'bg-rose-500/80',
  'Project Presentation': 'bg-fuchsia-500/80',
  'Career Research': 'bg-sky-500/80'
};

// Get activity color
function getActivityColor(activity: string): string {
  return activityColors[activity] || 'bg-slate-500/80';
}

// Generate AI schedule prompt
function generateSchedulePrompt(quiz: QuizData, currentSchedule?: ScheduleSlot[]): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'
  ];

  let currentScheduleText = 'Currently no schedule.';
  if (currentSchedule && currentSchedule.length > 0) {
    currentScheduleText = 'Current schedule:\n' + currentSchedule
      .map(s => `- ${s.day} at ${s.time}: ${s.activity}`)
      .join('\n');
  }

  return `You are an AI study schedule optimizer. Create an optimal weekly study schedule based on the student's profile.

STUDENT PROFILE:
- Grade/Level: ${quiz.grade || 'Not specified'}
- Career Interest: ${quiz.careerInterest || 'Not specified'}
- Academic Interests: ${quiz.academicInterests?.join(', ') || 'Not specified'}
- Academic Strengths: ${quiz.academicStrengths?.join(', ') || 'Not specified'}
- Preferred Work Environment: ${quiz.preferredEnvironment || 'Not specified'}
- Task Preference: ${quiz.taskPreference || 'Not specified'}
- Current Skills: ${quiz.skills?.join(', ') || 'Not specified'}
- Tech Confidence: ${quiz.techConfidence || 'Not specified'}
- Work-Life Balance Preference: ${quiz.workLife || 'Not specified'}
- Career Motivation: ${quiz.careerMotivation || 'Not specified'}
- Study Goal: ${quiz.studyGoal || 'Not specified'}

${currentScheduleText}

AVAILABLE TIME SLOTS: ${timeSlots.join(', ')}
DAYS: ${days.join(', ')}

AVAILABLE ACTIVITIES:
- Study Session
- Assignment Work
- Project Time
- Reading
- Practice Problems
- Group Study
- Break
- Review
- Coding Practice
- Math Problems
- Language Learning
- Science Lab
- Mock Tests
- Mentorship
- Project Presentation
- Career Research

REQUIREMENTS:
1. Create a balanced weekly schedule (all 7 days)
2. Allocate at least 3-4 study hours per day
3. Include 1-2 breaks per day (15-30 min breaks)
4. Match activities to student's interests and strengths
5. Vary activities to maintain engagement
6. Consider work-life balance preference
7. Ensure healthy sleep patterns (no late studies if student prefers work-life balance)
8. Prioritize career-relevant activities
9. Balance theory (study sessions, reading) with practice (problems, projects, coding)
10. Include group study if student prefers collaborative environment

OUTPUT FORMAT:
Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {
    "day": "Monday",
    "time": "6:00 AM",
    "activity": "Reading"
  },
  ...
]

RULES:
- Each slot should have exactly one activity
- Time slots must be exactly as listed above
- Days must be the full day name
- Activities must be from the available list
- Each day should have 4-6 activities scheduled
- Spread activities evenly across available time slots
- Return valid JSON only, no other text`;
}

// Parse schedule from AI response
function parseScheduleResponse(response: string): any[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing schedule response:', error);
    return [];
  }
}

// Generate fallback schedule if AI fails
function generateFallbackSchedule(quiz: QuizData): ScheduleSlot[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule: ScheduleSlot[] = [];

  const isTech = (quiz.careerInterest?.toLowerCase().includes('tech') ||
    quiz.careerInterest?.toLowerCase().includes('engineer') ||
    quiz.careerInterest?.toLowerCase().includes('code') ||
    quiz.skills?.some(s => s.toLowerCase().includes('programming'))) ?? false;

  const isMath = (quiz.academicInterests?.some(s => s.toLowerCase().includes('math')) ||
    quiz.academicStrengths?.some(s => s.toLowerCase().includes('math'))) ?? false;

  const isScience = (quiz.academicInterests?.some(s => s.toLowerCase().includes('science')) ||
    quiz.academicStrengths?.some(s => s.toLowerCase().includes('science'))) ?? false;

  const defaultSchedule: { [key: string]: string[] } = {
    Monday: ['Study Session', 'Break', isTech ? 'Coding Practice' : 'Reading', 'Practice Problems', 'Review'],
    Tuesday: ['Assignment Work', 'Break', 'Study Session', 'Group Study', 'Break'],
    Wednesday: ['Reading', 'Break', 'Practice Problems', 'Project Time', 'Review'],
    Thursday: ['Study Session', 'Break', isMath ? 'Math Problems' : 'Practice Problems', 'Mentorship', 'Break'],
    Friday: ['Project Time', 'Break', 'Review', 'Coding Practice', 'Study Session'],
    Saturday: ['Mock Tests', 'Break', 'Career Research', 'Reading', 'Group Study'],
    Sunday: ['Review', 'Break', 'Reading', 'Project Presentation', 'Study Session']
  };

  const timeSlots = ['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];
  let timeIndex = 0;

  days.forEach(day => {
    const activities = defaultSchedule[day] || ['Study Session', 'Break', 'Reading', 'Review'];
    activities.forEach((activity, index) => {
      if (timeIndex < timeSlots.length) {
        const slot: ScheduleSlot = {
          id: `${day}-${timeSlots[timeIndex]}`,
          day,
          time: timeSlots[timeIndex],
          activity,
          color: getActivityColor(activity)
        };
        schedule.push(slot);
        timeIndex++;
        if (timeIndex >= timeSlots.length) timeIndex = 0;
      }
    });
  });

  return schedule;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body: GenerateScheduleRequest = await request.json();
    const { quiz, currentSchedule } = body;

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz data is required' },
        { status: 400 }
      );
    }

    console.log('Generating schedule for user:', user.id);

    // Call Groq API for schedule generation
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: generateSchedulePrompt(quiz, currentSchedule)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false,
      })
    });

    if (!groqResponse.ok) {
      console.error('Groq API error:', await groqResponse.text());
      // Fall back to default schedule
      const fallbackSchedule = generateFallbackSchedule(quiz);
      return NextResponse.json({
        success: true,
        schedule: fallbackSchedule,
        source: 'fallback',
        message: 'Generated default schedule (AI service unavailable)'
      });
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices?.[0]?.message?.content || '';

    console.log('AI Response received, parsing schedule...');

    // Parse the AI response
    const parsedSchedule = parseScheduleResponse(aiResponse);

    if (parsedSchedule.length === 0) {
      console.warn('Failed to parse AI response, using fallback');
      const fallbackSchedule = generateFallbackSchedule(quiz);
      return NextResponse.json({
        success: true,
        schedule: fallbackSchedule,
        source: 'fallback',
        message: 'Generated default schedule (parsing error)'
      });
    }

    // Convert parsed schedule to ScheduleSlot format
    const schedule: ScheduleSlot[] = parsedSchedule
      .filter((item: any) => item.day && item.time && item.activity)
      .map((item: any) => ({
        id: `${item.day}-${item.time}`,
        day: item.day,
        time: item.time,
        activity: item.activity,
        color: getActivityColor(item.activity)
      }));

    console.log('Schedule generated successfully:', schedule.length, 'slots');

    return NextResponse.json({
      success: true,
      schedule,
      source: 'ai',
      message: 'Schedule generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
