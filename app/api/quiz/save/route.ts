import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizData = await req.json();

    // Upsert quiz results (insert or update if exists)
    const { data, error } = await supabase
      .from('user_quiz_results')
      .upsert({
        user_id: user.id,
        grade: quizData.grade,
        career_interest: quizData.careerInterest,
        academic_interests: quizData.academicInterests || [],
        academic_strengths: quizData.academicStrengths || [],
        preferred_environment: quizData.preferredEnvironment,
        task_preference: quizData.taskPreference,
        skills: quizData.skills || [],
        tech_confidence: quizData.techConfidence,
        work_life: quizData.workLife,
        career_motivation: quizData.careerMotivation,
        study_goal: quizData.studyGoal,
        career_suggestions: quizData.careerSuggestions || [],
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving quiz results:', error);
      return NextResponse.json({ error: 'Failed to save quiz results' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in quiz save API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
