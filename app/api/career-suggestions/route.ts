export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractJson(text: string) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  let fullQuizData: any = {};

  try {
    fullQuizData = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not configured, using fallback');
      const fallbackCareers = getFallbackCareers(fullQuizData);
      return new Response(
        JSON.stringify({ careers: fallbackCareers, fallback: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      grade,
      careerInterest,
      academicInterests = [],
      academicStrengths = [],
      preferredEnvironment,
      taskPreference,
      skills = [],
      techConfidence,
      workLife,
      careerMotivation,
      studyGoal,
    } = fullQuizData;

    const fullPrompt = `You are an expert AI specializing in Career Guidance, Education Planning, and Student Financial Advice.

Your ONLY task is to output EXACTLY 6 career recommendations in PURE JSON. No explanations. No text before or after. If you cannot complete the task, output an empty array [].

STUDENT PROFILE:
- Grade: ${grade}
- Primary Career Interest: ${careerInterest}
- Favorite Subjects: ${academicInterests.join(', ') || 'None'}
- Best Subjects: ${academicStrengths.join(', ') || 'None'}
- Work Environment: ${preferredEnvironment}
- Task Preference: ${taskPreference}
- Skills: ${skills.join(', ') || 'None'}
- Tech Confidence: ${techConfidence}
- Work-Life Balance: ${workLife}
- Motivation: ${careerMotivation}
- Study Goal: ${studyGoal}

OUTPUT FORMAT (MANDATORY):
Return ONLY a JSON array with EXACTLY 6 objects. Each object MUST contain:
title, description, salary, growth, education, degrees, skills, extracurricular, certifications, jobTitles, universities, financialAdvice (with budgetingTips, savingTips, educationCostAdvice, scholarshipSuggestions, earningWhileStudying).
`;

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
          { role: 'system', content: 'You are a strict JSON-only generator. Return only valid JSON.' },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.6,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content ?? '';
    const json = extractJson(output);

    if (json) {
      return new Response(
        JSON.stringify({ careers: json }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If JSON extraction failed, use fallback
    const fallbackCareers = getFallbackCareers(fullQuizData);
    return new Response(
      JSON.stringify({ careers: fallbackCareers, fallback: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('career-suggestions error', err);

    // Always return fallback data on error
    const fallbackCareers = getFallbackCareers(fullQuizData);
    return new Response(
      JSON.stringify({ careers: fallbackCareers, fallback: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ==========================================================
// COMPREHENSIVE FALLBACK DATA BASED ON USER PROFILE
// ==========================================================
function getFallbackCareers(profile: any) {
  // Base careers library
  const careersLibrary = [
    {
      title: 'Software Developer',
      description: 'Design, develop, and maintain software applications and systems.',
      salary: '$60k-$130k',
      growth: 'Very High',
      education: "Bachelor's in Computer Science",
      degrees: ['B.Sc. Computer Science', 'B.Tech Software Engineering'],
      skills: ['Programming', 'Problem-solving', 'Algorithms', 'Data Structures'],
      extracurricular: ['Coding clubs', 'Hackathons', 'Open source contributions'],
      certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
      jobTitles: ['Software Engineer', 'Full Stack Developer', 'Backend Developer'],
      universities: ['Pulchowk Campus (IOE)', 'Kathmandu University', 'MIT', 'Stanford'],
      financialAdvice: {
        budgetingTips: ['Track monthly expenses', 'Set aside 20% for savings'],
        savingTips: ['Start with small freelance projects', 'Build a portfolio'],
        educationCostAdvice: 'Many online resources are free. Consider bootcamps as alternatives.',
        scholarshipSuggestions: 'Apply for STEM scholarships, Google scholarships, and university merit awards.',
        earningWhileStudying: 'Freelance coding, tutoring, or internships at tech companies.'
      }
    },
    {
      title: 'Data Scientist',
      description: 'Analyze complex data to help organizations make better decisions.',
      salary: '$70k-$140k',
      growth: 'Very High',
      education: "Bachelor's in Statistics, Math, or Computer Science",
      degrees: ['B.Sc. Statistics', 'B.Sc. Mathematics', 'B.Sc. Data Science'],
      skills: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization'],
      extracurricular: ['Data science competitions', 'Research projects'],
      certifications: ['IBM Data Science', 'Google Data Analytics'],
      jobTitles: ['Data Analyst', 'ML Engineer', 'Business Intelligence Analyst'],
      universities: ['Tribhuvan University', 'Kathmandu University', 'UC Berkeley', 'Carnegie Mellon'],
      financialAdvice: {
        budgetingTips: ['Invest in online courses', 'Budget for software tools'],
        savingTips: ['Participate in Kaggle competitions for prizes'],
        educationCostAdvice: 'Many free resources available online (Coursera, edX).',
        scholarshipSuggestions: 'Look for data science and analytics scholarships.',
        earningWhileStudying: 'Data analysis freelancing, research assistantships.'
      }
    },
    {
      title: 'Business Analyst',
      description: 'Bridge the gap between IT and business to improve processes and systems.',
      salary: '$55k-$110k',
      growth: 'High',
      education: "Bachelor's in Business, Economics, or related field",
      degrees: ['BBA', 'B.Sc. Economics', 'MBA'],
      skills: ['Data Analysis', 'Communication', 'Problem-solving', 'Excel'],
      extracurricular: ['Business clubs', 'Case competitions'],
      certifications: ['CBAP', 'PMI-PBA', 'Six Sigma'],
      jobTitles: ['Business Analyst', 'Systems Analyst', 'Product Manager'],
      universities: ['Ace Institute of Management', 'Kathmandu University', 'Wharton', 'Harvard'],
      financialAdvice: {
        budgetingTips: ['Create detailed financial plans', 'Track ROI on education'],
        savingTips: ['Network for internship opportunities'],
        educationCostAdvice: 'Consider part-time MBA programs while working.',
        scholarshipSuggestions: 'Business school scholarships, corporate sponsorships.',
        earningWhileStudying: 'Consulting projects, business plan competitions.'
      }
    },
    {
      title: 'Digital Marketing Specialist',
      description: 'Create and manage online marketing campaigns to promote products and services.',
      salary: '$45k-$95k',
      growth: 'High',
      education: "Bachelor's in Marketing, Communications, or Business",
      degrees: ['BBA Marketing', 'B.A. Communications'],
      skills: ['SEO', 'Content Marketing', 'Social Media', 'Analytics'],
      extracurricular: ['Marketing clubs', 'Social media management'],
      certifications: ['Google Ads', 'HubSpot', 'Facebook Blueprint'],
      jobTitles: ['Digital Marketer', 'SEO Specialist', 'Content Strategist'],
      universities: ['Ace Institute', 'Kathmandu University', 'NYU', 'Northwestern'],
      financialAdvice: {
        budgetingTips: ['Invest in marketing tools and courses'],
        savingTips: ['Build personal brand online'],
        educationCostAdvice: 'Many certifications are affordable or free.',
        scholarshipSuggestions: 'Marketing and communications scholarships.',
        earningWhileStudying: 'Freelance social media management, content writing.'
      }
    },
    {
      title: 'Mechanical Engineer',
      description: 'Design, develop, and test mechanical devices and systems.',
      salary: '$60k-$115k',
      growth: 'Medium',
      education: "Bachelor's in Mechanical Engineering",
      degrees: ['B.E. Mechanical', 'B.Tech Mechanical'],
      skills: ['CAD', 'Thermodynamics', 'Materials Science', 'Problem-solving'],
      extracurricular: ['Robotics clubs', 'Engineering competitions'],
      certifications: ['PE License', 'AutoCAD', 'SolidWorks'],
      jobTitles: ['Mechanical Engineer', 'Design Engineer', 'Manufacturing Engineer'],
      universities: ['Pulchowk Campus', 'Kathmandu University', 'MIT', 'Georgia Tech'],
      financialAdvice: {
        budgetingTips: ['Budget for software licenses and tools'],
        savingTips: ['Participate in engineering competitions'],
        educationCostAdvice: 'Engineering programs can be expensive; seek scholarships early.',
        scholarshipSuggestions: 'STEM scholarships, engineering society awards.',
        earningWhileStudying: 'Engineering internships, CAD freelancing.'
      }
    },
    {
      title: 'Graphic Designer',
      description: 'Create visual concepts to communicate ideas that inspire and inform consumers.',
      salary: '$40k-$85k',
      growth: 'Medium',
      education: "Bachelor's in Graphic Design or Fine Arts",
      degrees: ['B.F.A. Graphic Design', 'B.A. Visual Arts'],
      skills: ['Adobe Creative Suite', 'Typography', 'Color Theory', 'Creativity'],
      extracurricular: ['Art clubs', 'Design competitions'],
      certifications: ['Adobe Certified', 'UX Design Certificate'],
      jobTitles: ['Graphic Designer', 'UI Designer', 'Brand Designer'],
      universities: ['Kathmandu University', 'Rhode Island School of Design', 'Parsons'],
      financialAdvice: {
        budgetingTips: ['Invest in design software subscriptions'],
        savingTips: ['Build a strong portfolio online'],
        educationCostAdvice: 'Consider online courses and bootcamps as alternatives.',
        scholarshipSuggestions: 'Art and design scholarships, portfolio-based awards.',
        earningWhileStudying: 'Freelance design work, logo design contests.'
      }
    }
  ];

  return careersLibrary;
}
