import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
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

    // Get quiz results for the user
    const { data, error } = await supabase
      .from('user_quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No quiz results found
        return NextResponse.json({ data: null });
      }
      console.error('Error fetching quiz results:', error);
      return NextResponse.json({ error: 'Failed to fetch quiz results' }, { status: 500 });
    }

    // Transform database format to app format
    const quizData = {
      grade: data.grade,
      careerInterest: data.career_interest,
      academicInterests: data.academic_interests,
      academicStrengths: data.academic_strengths,
      preferredEnvironment: data.preferred_environment,
      taskPreference: data.task_preference,
      skills: data.skills,
      techConfidence: data.tech_confidence,
      workLife: data.work_life,
      careerMotivation: data.career_motivation,
      studyGoal: data.study_goal,
    };

    return NextResponse.json({
      data: quizData,
      careers: data.career_suggestions || []
    });
  } catch (error) {
    console.error('Error in quiz get API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
