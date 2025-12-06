import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Build enhanced context-aware prompt with career data
    let profileContext = '';

    if (context?.profile) {
      profileContext = `User Profile:
- Grade/Level: ${context.profile.grade || 'Not specified'}
- Career Interest: ${context.profile.careerInterest || 'Not specified'}
- Academic Interests: ${context.profile.academicInterests?.join(', ') || 'Not specified'}
- Academic Strengths: ${context.profile.academicStrengths?.join(', ') || 'Not specified'}
- Work Preference: ${context.profile.preferredEnvironment || 'Not specified'}
- Tech Confidence: ${context.profile.techConfidence || 'Not specified'}
- Work-Life Balance Priority: ${context.profile.workLife || 'Not specified'}
- Career Goal: ${context.profile.careerMotivation || 'Not specified'}`;
    }

    let careerContext = '';
    if (context?.careerSuggestions && Array.isArray(context.careerSuggestions)) {
      const topCareers = context.careerSuggestions.slice(0, 3).map((c: any) => ({
        title: c.title,
        fitScore: c.fitScore || 70,
        matchExplanation: c.matchExplanation || ''
      }));
      careerContext = `Current recommended careers: ${topCareers.map((c: any) => `${c.title} (Fit: ${c.fitScore}%)`).join(', ')}`;
    }

    const systemPrompt = `You are MentorAssist, an AI career guidance assistant helping students with their career planning, study plans, and financial advice. You provide personalized, actionable guidance.

${profileContext ? `STUDENT PROFILE:\n${profileContext}\n` : ''}
${careerContext ? `\n${careerContext}\n` : ''}

YOUR RESPONSIBILITIES:
- Provide personalized career guidance based on the student's profile
- Create actionable study and financial plans
- Recommend realistic paths given Nepal's education system and job market
- Be encouraging while setting realistic expectations
- Reference specific careers when relevant (especially from recommendations)
- Provide step-by-step, achievable guidance

GUIDANCE PRINCIPLES:
1. Nepal Context: Acknowledge Nepal's job market, education system (NEB, +2, universities), and financial realities
2. Personalization: Reference student's interests, strengths, and goals
3. Practicality: Provide achievable steps and realistic timelines
4. Encouragement: Be supportive while honest about challenges
5. Specificity: Mention universities, companies, certifications, or programs by name when possible

FORMATTING RULES:
- Use **bold text** for important terms, career names, and headings (e.g., **Software Engineering**, **Scholarship Opportunities**)
- Use numbered lists (1. 2. 3.) for sequential steps, timelines, or rankings
- Use bullet points (- or •) for related items or options
- Break content into clear sections with headings
- Keep paragraphs concise (2-3 sentences max)
- Use line breaks between sections for readability

COMMON TOPICS YOU HELP WITH:
- Career path planning and realistic timelines
- Skill development roadmaps
- University and course selection for Nepal
- Scholarship and financial aid information
- Study plan creation (3-month, 6-month, 1-year)
- Budget planning and earning opportunities
- Balancing studies with work
- Overcoming educational barriers
- Entrepreneurial opportunities

Be specific, encouraging, well-organized, and always considerate of Nepal's context.`;

    let userPrompt = message;

    // Enhance prompt with additional context if available
    if (context?.profile) {
      userPrompt = `${message}

${careerContext ? `\n(Reference these recommended careers when relevant: ${careerContext})` : ''}`;
    }

    // Call Groq API directly using fetch
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'AI service authentication failed.' },
          { status: 503 }
        );
      }

      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI Chat Error:', error);

    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
