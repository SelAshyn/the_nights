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

    // Build context-aware prompt
    const systemPrompt = `You are MentorAssist, an AI career guidance assistant helping students with their career planning, study plans, and financial advice.

You provide:
- Actionable career guidance
- Step-by-step study plans
- Realistic budgeting tips
- Scholarship information
- University recommendations
- Practical advice for students

FORMATTING RULES:
- Use **bold text** for important terms and headings (e.g., **Scholarship Opportunities:**)
- Use numbered lists (1. 2. 3.) for sequential steps or rankings
- Use bullet points (- or •) for non-sequential items
- Break content into clear sections with headings
- Keep paragraphs concise (2-3 sentences max)
- Use line breaks between sections

Be specific, encouraging, and well-organized in your responses.`;

    let userPrompt = message;

    // Add context if available
    if (context?.profile) {
      userPrompt = `User Profile: Grade ${context.profile.grade || 'N/A'}, Interests: ${context.profile.academicInterests?.join(', ') || 'N/A'}

${message}`;
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
        max_tokens: 1500,
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
