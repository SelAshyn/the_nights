export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractJson(text: string) {
  try {
    // Try multiple extraction strategies
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\])/);

    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const cleaned = jsonText.replace(/^json\s*/, '').trim();
      return JSON.parse(cleaned);
    }

    // If no match found, try parsing the whole text
    return JSON.parse(text.trim());
  } catch (e) {
    console.error('JSON extraction failed:', e);
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

    // CALCULATE FIT SCORES FOR INTELLIGENT RANKING
    const calculateProfileIntensity = () => {
      let techScore = 0, businessScore = 0, healthScore = 0, scienceScore = 0, artsScore = 0;

      const interests = [careerInterest, ...academicInterests, ...academicStrengths].map(s => (s || '').toLowerCase());
      const skillsList = [...skills, techConfidence, taskPreference, careerMotivation].map(s => (s || '').toLowerCase());

      // Tech-related scoring
      if (interests.some(i => i.match(/tech|software|engineer|coding|programmer|developer|computer|data|it/))) techScore += 30;
      if (skillsList.some(s => s.match(/high|coding|data|technical|programming/))) techScore += 20;

      // Business-related scoring
      if (interests.some(i => i.match(/business|management|finance|entrepreneur|market|trade/))) businessScore += 30;
      if (skillsList.some(s => s.match(/leadership|communication|high/))) businessScore += 20;

      // Healthcare scoring
      if (interests.some(i => i.match(/medical|health|doctor|nurse|science|biology/))) healthScore += 30;

      // Science scoring
      if (interests.some(i => i.match(/science|research|lab|experiment|chemistry|physics|biology/))) scienceScore += 30;

      // Arts scoring
      if (interests.some(i => i.match(/art|design|writing|media|journalism|communication/))) artsScore += 30;

      return { techScore, businessScore, healthScore, scienceScore, artsScore };
    };

    const profileScores = calculateProfileIntensity();

    // ENHANCED PROMPT WITH CONTEXTUAL DETAILS AND MATCHING
    const fullPrompt = `You are an expert AI Career Strategist specializing in Nepal-specific career guidance, education planning, and financial advice for students.

CRITICAL INSTRUCTIONS:
1. Output EXACTLY 6 career recommendations, ranked by fit to student profile
2. Return ONLY valid JSON array, no other text, no markdown
3. If you cannot complete the task, output exactly: []
4. Use Nepali context and local market insights where relevant
5. Order careers from BEST to LEAST FIT for the student

STUDENT PROFILE ANALYSIS:
- Grade Level: ${grade} (Nepali education system context)
- Primary Career Interest: ${careerInterest || 'Not specified'}
- Academic Interests: ${academicInterests.join(', ') || 'Not specified'}
- Academic Strengths: ${academicStrengths.join(', ') || 'Not specified'}
- Preferred Work Environment: ${preferredEnvironment || 'Not specified'}
- Task Preference: ${taskPreference || 'Not specified'}
- Current Skills: ${skills.join(', ') || 'Basic skills'}
- Technology Confidence: ${techConfidence || 'Not specified'}
- Work-Life Balance Priority: ${workLife || 'Not specified'}
- Career Motivation: ${careerMotivation || 'Not specified'}
- Study Goals: ${studyGoal || 'Not specified'}

MATCHING PRIORITIES:
- Tech focus score: ${profileScores.techScore}%
- Business focus score: ${profileScores.businessScore}%
- Healthcare focus score: ${profileScores.healthScore}%
- Science focus score: ${profileScores.scienceScore}%
- Arts focus score: ${profileScores.artsScore}%

RECOMMENDATION STRATEGY:
1. Primary recommendation (Rank 1-2): MUST directly match stated interest "${careerInterest || 'student\'s primary focus'}"
2. Secondary recommendations (Rank 3-4): Match academic strengths and work environment preference
3. Stretch recommendations (Rank 5-6): Emerging opportunities and entrepreneurial alternatives
4. DIVERSITY: Include at least one Nepal-specific career, one global opportunity, one tech-related option

CONTEXTUAL CONSIDERATIONS FOR NEPAL:
1. Salary figures: Use realistic NPR ranges (entry-level typically NPR 15,000-50,000)
2. Job market: Tech sector growing rapidly; medical professionals in high demand; tourism recovering
3. Education: Consider NEB, +2 system; IOE, Kathmandu University as reference points
4. Geography: Urban vs rural opportunities; remote work viability
5. Finances: Family budgets typically limited; scholarships crucial
6. Entrepreneurship: Growing startup culture in Kathmandu

OUTPUT FORMAT (JSON ARRAY with EXACTLY 6 objects, ORDERED BY FIT):
Each career object MUST include these fields with detailed, realistic information:

{
  "title": "Career field name",
  "description": "Comprehensive 80-100 word description including daily work, industry context in Nepal, and growth potential",
  "salary": {
    "entryLevel": "Realistic entry salary in NPR for Nepal",
    "midCareer": "5-7 year salary in NPR",
    "seniorLevel": "10+ year salary in NPR",
    "globalComparison": "Equivalent in USD for international context"
  },
  "growth": {
    "nepalMarket": "High/Medium/Low growth in Nepal with specific reasons",
    "globalTrend": "International growth trend",
    "automationRisk": "Low/Medium/High",
    "futureOutlook": "Next 5-10 year projection"
  },
  "education": {
    "pathway": "Step-by-step educational path from current grade ${grade}",
    "timeline": "Year-by-year progression",
    "nepalOptions": ["Specific universities/colleges in Nepal"],
    "internationalOptions": ["Top global universities with locations"],
    "costEstimate": {
      "nepal": "Approximate total cost in NPR",
      "international": "Approximate cost if studying abroad"
    }
  },
  "degrees": {
    "essential": ["Minimum required degrees"],
    "recommended": ["Additional beneficial degrees"],
    "alternative": ["Alternative paths (diplomas, certifications)"]
  },
  "skills": {
    "technical": ["Specific technical skills required"],
    "soft": ["Essential soft skills"],
    "developmentPlan": "How to develop these skills"
  },
  "extracurricular": {
    "schoolLevel": ["Activities for grades ${grade}-12"],
    "undergraduate": ["University-level activities"],
    "online": ["Digital platforms for skill building"]
  },
  "certifications": {
    "local": ["CTEVT or Nepal-based certifications"],
    "international": ["Global certifications"],
    "online": ["MOOC platforms offering relevant courses"]
  },
  "jobTitles": {
    "entry": ["First job titles in Nepal"],
    "mid": ["Mid-career positions"],
    "senior": ["Leadership roles"],
    "entrepreneurial": ["Self-employment options"]
  },
  "universities": [
    {
      "name": "TOP WORLDWIDE UNIVERSITY (Priority: MIT, Stanford, Cambridge, Oxford, Caltech, NUS, Tokyo Tech, ETH Zurich, IIT India, etc.)",
      "location": "City, Country",
      "program": "Specific degree program matching the career",
      "nepalRelevance": "How this university/program applies to Nepal job market",
      "scholarshipInfo": "Scholarship opportunities available for Nepali/international students"
    }
  ],
  "CRITICAL_NOTE": "Include 5-8 TOTAL universities per career. Start with top 5-10 worldwide ranked universities by prestige, then add 1-2 Nepal options (IOE, Kathmandu University, Pokhara University). Order by prestige/relevance."
  "financialAdvice": {
    "budgetingTips": ["Specific budgeting strategies for Nepali students"],
    "savingTips": ["Practical saving methods"],
    "educationCostAdvice": "Detailed cost breakdown and planning advice",
    "scholarshipSuggestions": {
      "government": ["NPC, Ministry of Education programs"],
      "university": ["Specific university scholarships"],
      "international": ["Fulbright, DAAD, etc."],
      "corporate": ["Company sponsorships in Nepal"]
    },
    "earningWhileStudying": {
      "partTime": ["Local part-time job ideas"],
      "freelance": ["Online freelancing options"],
      "internships": ["Paid internship opportunities"],
      "entrepreneurial": ["Small business ideas for students"]
    }
  },
  "riskAssessment": {
    "marketSaturation": "Current competition level in Nepal",
    "barriersToEntry": "Challenges faced by Nepali students",
    "adaptationRequired": "How the field is changing",
    "alternativePaths": "Related career options"
  },
  "successMetrics": {
    "shortTerm": "1-2 year goals",
    "mediumTerm": "3-5 year milestones",
    "longTerm": "10+ year vision",
    "keyPerformanceIndicators": "How to measure progress"
  },
  "fitScore": "Score from 1-100 based on how well this career matches the student's profile, interests, and strengths. IMPORTANT: This is NOT a grading score; it's a personalized match percentage (85-95 for excellent fits, 70-84 for good fits, 55-69 for growth opportunities)",
  "matchExplanation": "Brief explanation (1-2 sentences) of why this career matches or challenges the student, referencing specific profile elements",
  "nepalOpportunities": "Specific job opportunities and companies in Nepal where this career is in demand",
  "remoteWork": "Yes/No - Can this career be done remotely? Mention platforms and opportunities"
}

SCORING RUBRIC FOR fitScore:
- 90-100: Excellent fit (matches interest + strengths + environment preference)
- 75-89: Good fit (matches 2-3 profile elements, some effort needed)
- 60-74: Moderate fit (interesting to student but requires more development)
- 45-59: Growth opportunity (outside comfort zone but achievable)
- 30-44: Stretch goal (significant learning curve)

DIVERSITY REQUIREMENTS:
Include at least:
1. One locally-focused Nepal-specific career (high domestic demand)
2. One globally-oriented career with international opportunities
3. One emerging technology/digital career (growing market)
4. One traditional stable profession (established demand)
5. One entrepreneurial/business-focused career (startup potential)
6. One social impact/public service career (community contribution)

OUTPUT ORDERING:
Rank recommendations from HIGHEST fitScore to LOWEST. First 2-3 should be 75+ scores for the student's best matches.

IMPORTANT NOTES:
1. **ALL SALARY FIGURES IN NPR (NEPALI RUPEES) ONLY** - Use numbers, NOT strings
2. Entry-level: NPR 18,000-50,000 per month (varies by field in Nepal)
3. Mid-career (5-7 years): Usually 2-4x entry = NPR 50,000-150,000 per month
4. Senior level (10+ years): Usually 3-6x entry = NPR 100,000-300,000+ per month
5. globalComparison: ALWAYS include USD equivalent (e.g., "Approx $200-400 USD per month")
6. Include 2-3 specific Nepali company examples where applicable
7. UNIVERSITIES CRITICAL: 5-8 per career mixing top worldwide (MIT, Stanford, Cambridge, Oxford, Caltech, NUS, Tokyo Tech, ETH Zurich, IIT India, Carnegie Mellon) with Nepal options
8. Reference real Nepal job market trends, company hiring, and realistic opportunities`;

    // Call Groq API with enhanced configuration
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a structured JSON generator. Return ONLY valid JSON arrays. Never add explanations, notes, or additional text. Format all numbers as strings to prevent JSON parsing issues.'
          },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.5,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content ?? '';
    console.log('Raw API output:', output.substring(0, 500)); // Log first 500 chars for debugging

    const json = extractJson(output);

    if (json && Array.isArray(json) && json.length === 6) {
      // Validate and clean JSON structure, including new fields
      const validatedCareers = json.map(career => ({
        title: career.title || 'Unknown Career',
        description: career.description || 'No description available',
        fitScore: typeof career.fitScore === 'number' ? Math.max(1, Math.min(100, career.fitScore)) : 70,
        matchExplanation: career.matchExplanation || 'This career offers interesting opportunities based on your profile.',
        nepalOpportunities: typeof career.nepalOpportunities === 'string' ? career.nepalOpportunities : 'Various opportunities available across industries.',
        remoteWork: typeof career.remoteWork === 'string' ? career.remoteWork : 'Varies by role',
        salary: typeof career.salary === 'object' ? career.salary : {
          entryLevel: 'NPR 20,000-40,000',
          midCareer: 'NPR 50,000-100,000',
          seniorLevel: 'NPR 100,000+',
          globalComparison: '$ equivalent'
        },
        growth: typeof career.growth === 'object' ? career.growth : {
          nepalMarket: 'Medium',
          globalTrend: 'Growing',
          automationRisk: 'Low',
          futureOutlook: 'Positive'
        },
        education: typeof career.education === 'object' ? career.education : {
          pathway: 'Standard educational path',
          timeline: '4-5 years',
          nepalOptions: ['Local universities'],
          internationalOptions: ['Global universities'],
          costEstimate: { nepal: 'NPR 500,000-1,000,000', international: 'Varies' }
        },
        degrees: typeof career.degrees === 'object' ? career.degrees : {
          essential: ['Bachelor\'s degree'],
          recommended: ['Master\'s degree'],
          alternative: ['Diplomas/Certifications']
        },
        skills: typeof career.skills === 'object' ? career.skills : {
          technical: ['Basic skills'],
          soft: ['Communication', 'Teamwork'],
          developmentPlan: 'Practice and training'
        },
        extracurricular: typeof career.extracurricular === 'object' ? career.extracurricular : {
          schoolLevel: ['School clubs'],
          undergraduate: ['University societies'],
          online: ['Online courses']
        },
        certifications: typeof career.certifications === 'object' ? career.certifications : {
          local: ['Local certifications'],
          international: ['Global certs'],
          online: ['Online platforms']
        },
        jobTitles: typeof career.jobTitles === 'object' ? career.jobTitles : {
          entry: ['Junior Position'],
          mid: ['Mid-level Position'],
          senior: ['Senior Position'],
          entrepreneurial: ['Business Owner']
        },
        universities: Array.isArray(career.universities) ? career.universities : [
          { name: 'Local University', location: 'Nepal', program: 'Relevant Program', nepalRelevance: 'High', scholarshipInfo: 'Available' }
        ],
        financialAdvice: typeof career.financialAdvice === 'object' ? career.financialAdvice : {
          budgetingTips: ['Create monthly budget'],
          savingTips: ['Save 20% of income'],
          educationCostAdvice: 'Plan for educational expenses',
          scholarshipSuggestions: { government: [], university: [], international: [], corporate: [] },
          earningWhileStudying: { partTime: [], freelance: [], internships: [], entrepreneurial: [] }
        },
        riskAssessment: typeof career.riskAssessment === 'object' ? career.riskAssessment : {
          marketSaturation: 'Moderate',
          barriersToEntry: 'Standard',
          adaptationRequired: 'Continuous learning needed',
          alternativePaths: 'Related careers available'
        },
        successMetrics: typeof career.successMetrics === 'object' ? career.successMetrics : {
          shortTerm: 'Complete education',
          mediumTerm: 'Gain experience',
          longTerm: 'Achieve career goals',
          keyPerformanceIndicators: 'Skill development'
        }
      }));

      return new Response(
        JSON.stringify({ careers: validatedCareers, source: 'ai' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    } else {
      console.warn('AI response invalid or incomplete, using fallback');
      throw new Error('Invalid AI response format');
    }

  } catch (err: any) {
    console.error('Career suggestions error:', err);

    // Return comprehensive fallback data
    const fallbackCareers = getFallbackCareers(fullQuizData);
    return new Response(
      JSON.stringify({
        careers: fallbackCareers,
        fallback: true,
        message: 'Using enhanced fallback recommendations',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}

// ==========================================================
// ENHANCED COMPREHENSIVE FALLBACK DATA
// ==========================================================
function getFallbackCareers(profile: any) {
  // Profile-based customization
  const grade = profile?.grade || '10';
  const interest = profile?.careerInterest?.toLowerCase() || '';
  const subjects = [...(profile?.academicInterests || []), ...(profile?.academicStrengths || [])];

  // Base career library with Nepal-specific data
  const careersLibrary = [
    {
      title: 'Software Engineer',
      description: 'Design, develop, and maintain software applications and systems. In Nepal, there\'s growing demand in fintech, e-commerce, and outsourcing companies. Remote work opportunities allow working for international companies from Nepal.',
      salary: {
        entryLevel: 'NPR 25,000 - 45,000',
        midCareer: 'NPR 70,000 - 150,000',
        seniorLevel: 'NPR 150,000 - 300,000+',
        globalComparison: '$60,000 - $180,000'
      },
      growth: {
        nepalMarket: 'Very High',
        globalTrend: 'Rapidly Growing',
        automationRisk: 'Low',
        futureOutlook: 'Excellent with digital transformation'
      },
      education: {
        pathway: `${grade} → +2 Science/Computer → B.Sc. CSIT/B.E. Computer → Optional Master's`,
        timeline: '4-5 years for bachelor\'s + internship',
        nepalOptions: ['IOE Pulchowk Campus', 'Kathmandu University', 'Pokhara University', 'TU-affiliated colleges'],
        internationalOptions: [
          { name: 'MIT', location: 'USA', program: 'Computer Science', nepalRelevance: 'High', scholarshipInfo: 'Need-based available' },
          { name: 'Stanford', location: 'USA', program: 'CS/Software Engineering', nepalRelevance: 'High', scholarshipInfo: 'Merit-based' }
        ],
        costEstimate: {
          nepal: 'NPR 500,000 - 1,200,000',
          international: '$30,000 - $70,000 per year'
        }
      },
      degrees: {
        essential: ['B.Sc. CSIT', 'B.E. Computer Engineering', 'BCA'],
        recommended: ['MCA', 'M.Sc. Computer Science', 'MBA Tech'],
        alternative: ['Diploma in Computer Engineering', 'Bootcamp certifications']
      },
      skills: {
        technical: ['Python/Java/JavaScript', 'Data Structures', 'Database Management', 'Web Development'],
        soft: ['Problem-solving', 'Team Collaboration', 'Communication', 'Adaptability'],
        developmentPlan: 'Start with online tutorials, contribute to GitHub projects, join coding communities like FOSS Nepal'
      },
      extracurricular: {
        schoolLevel: ['Computer club', 'Science exhibitions', 'Basic programming projects'],
        undergraduate: ['FOSS communities', 'Hackathons', 'Tech conferences', 'Research projects'],
        online: ['GitHub contributions', 'LeetCode practice', 'Open source projects']
      },
      certifications: {
        local: ['CTEVT Diploma in Computer Engineering'],
        international: ['AWS Certified Developer', 'Google Cloud Professional', 'Oracle Java Certifications'],
        online: ['Coursera Specializations', 'edX MicroMasters', 'freeCodeCamp certifications']
      },
      jobTitles: {
        entry: ['Junior Developer', 'Software Trainee', 'QA Engineer'],
        mid: ['Software Engineer', 'Full Stack Developer', 'DevOps Engineer'],
        senior: ['Senior Developer', 'Tech Lead', 'Software Architect'],
        entrepreneurial: ['Tech Startup Founder', 'Freelance Developer', 'App Development Agency']
      },
      universities: [
        { name: 'Institute of Engineering (IOE)', location: 'Kathmandu, Nepal', program: 'B.E. Computer', nepalRelevance: 'Very High', scholarshipInfo: 'Government scholarships available' },
        { name: 'Kathmandu University', location: 'Dhulikhel, Nepal', program: 'B.Sc. CSIT', nepalRelevance: 'High', scholarshipInfo: 'Merit-based scholarships' },
        { name: 'Massachusetts Institute of Technology', location: 'USA', program: 'Computer Science', nepalRelevance: 'Global standard', scholarshipInfo: 'Financial aid available' }
      ],
      financialAdvice: {
        budgetingTips: ['Allocate 30% for education, 20% savings, 50% living expenses', 'Use budgeting apps like Khalti or eSewa for tracking'],
        savingTips: ['Start SIP in mutual funds', 'Save 20% from freelance earnings', 'Use digital wallets for micro-savings'],
        educationCostAdvice: 'Public campuses are affordable (NPR 50k-100k/year), private colleges cost NPR 200k-500k/year. Consider education loans from NMB, NIC Asia with student-friendly terms.',
        scholarshipSuggestions: {
          government: ['National Scholarship Program', 'IOE Entrance Top Rankers'],
          university: ['KU Merit Scholarships', 'TU Fee Waivers for needy students'],
          international: ['Fulbright, DAAD for Masters/PhD', 'Google Women Techmakers'],
          corporate: ['F1Soft Scholarship', 'Leapfrog Technology Scholarships']
        },
        earningWhileStudying: {
          partTime: ['Campus computer lab assistant', 'Local software company intern'],
          freelance: ['Upwork/Fiverr projects', 'Local website development'],
          internships: ['Summer internships at Nepali tech companies', 'Remote internships with international firms'],
          entrepreneurial: ['Develop mobile apps for local businesses', 'Create educational tech solutions']
        }
      },
      riskAssessment: {
        marketSaturation: 'Growing demand, moderate competition',
        barriersToEntry: 'Continuous learning required, rapidly changing technologies',
        adaptationRequired: 'Must stay updated with new frameworks and tools',
        alternativePaths: 'IT Management, Data Science, Cybersecurity, Technical Writing'
      },
      successMetrics: {
        shortTerm: 'Learn 2 programming languages, build portfolio with 3 projects',
        mediumTerm: 'Get first job/internship, earn relevant certifications',
        longTerm: 'Lead development teams, specialize in emerging tech',
        keyPerformanceIndicators: 'GitHub activity, certification completions, project complexity'
      }
    },
    {
      title: 'Healthcare Professional (Doctor)',
      description: 'Diagnose and treat illnesses, promote health and wellbeing. Nepal needs more doctors, especially in rural areas. Specializations offer diverse career paths.',
      salary: {
        entryLevel: 'NPR 40,000 - 70,000 (Internship)',
        midCareer: 'NPR 100,000 - 300,000',
        seniorLevel: 'NPR 300,000 - 800,000+',
        globalComparison: '$80,000 - $400,000'
      },
      growth: {
        nepalMarket: 'High (Especially specialists)',
        globalTrend: 'Stable with aging populations',
        automationRisk: 'Low',
        futureOutlook: 'Excellent with healthcare infrastructure development'
      },
      education: {
        pathway: `${grade} → +2 Science (Biology) → MBBS (5.5 years) → Internship → Optional MD/MS`,
        timeline: '6-8 years minimum',
        nepalOptions: ['Institute of Medicine (IOM)', 'BP Koirala Institute', 'KU School of Medical Sciences'],
        internationalOptions: [
          { name: 'Harvard Medical School', location: 'USA', program: 'MD', nepalRelevance: 'Global recognition', scholarshipInfo: 'Limited, highly competitive' },
          { name: 'AIIMS', location: 'India', program: 'MBBS', nepalRelevance: 'High (popular choice)', scholarshipInfo: 'Merit-based' }
        ],
        costEstimate: {
          nepal: 'NPR 3,000,000 - 8,000,000',
          international: '$200,000 - $400,000'
        }
      },
      degrees: {
        essential: ['MBBS', 'BDS (Dentistry)', 'B.Sc. Nursing'],
        recommended: ['MD/MS Specialization', 'MPH', 'Hospital Management'],
        alternative: ['HA/Staff Nurse', 'Medical Lab Technology', 'Pharmacy']
      },
      skills: {
        technical: ['Medical knowledge', 'Diagnostic skills', 'Surgical techniques', 'Patient management'],
        soft: ['Empathy', 'Communication', 'Stress management', 'Ethical judgment'],
        developmentPlan: 'Volunteer at clinics, shadow doctors, participate in health camps'
      },
      extracurricular: {
        schoolLevel: ['Science club', 'First aid training', 'Biology competitions'],
        undergraduate: ['Medical camps', 'Research projects', 'Health awareness programs'],
        online: ['Medical journals', 'Online medical courses', 'Case study discussions']
      },
      certifications: {
        local: ['NMC Registration', 'Specialist Council Registration'],
        international: ['USMLE', 'PLAB', 'AMC'],
        online: ['Coursera medical courses', 'edX public health programs']
      },
      jobTitles: {
        entry: ['Medical Intern', 'Resident Doctor'],
        mid: ['General Practitioner', 'Specialist Doctor'],
        senior: ['Consultant', 'Department Head', 'Medical Director'],
        entrepreneurial: ['Clinic Owner', 'Specialized Hospital Founder', 'Telemedicine Service']
      },
      universities: [
        { name: 'Institute of Medicine', location: 'Kathmandu, Nepal', program: 'MBBS', nepalRelevance: 'Highest', scholarshipInfo: 'Government quotas available' },
        { name: 'BP Koirala Institute', location: 'Dharan, Nepal', program: 'MBBS', nepalRelevance: 'High', scholarshipInfo: 'Scholarships for meritorious students' }
      ],
      financialAdvice: {
        budgetingTips: ['Medical education is expensive; plan for long-term financing', 'Consider government colleges for lower fees'],
        savingTips: ['Start education fund early', 'Look for combined MBBS-MD programs'],
        educationCostAdvice: 'Government medical colleges: NPR 500k-1M total. Private: NPR 3M-8M. Consider educational loans with longer repayment periods.',
        scholarshipSuggestions: {
          government: ['Ministry of Education scholarships', 'Provincial government quotas'],
          university: ['IOM merit scholarships', 'Need-based fee waivers'],
          international: ['WHO scholarships', 'Country-specific medical scholarships'],
          corporate: ['Hospital sponsorships with service bonds']
        },
        earningWhileStudying: {
          partTime: ['Medical transcription', 'Coaching +2 science students'],
          freelance: ['Health content writing', 'Medical research assistance'],
          internships: ['Summer internships at hospitals', 'Public health projects'],
          entrepreneurial: ['Health blog/vlog', 'Medical equipment rental service']
        }
      },
      riskAssessment: {
        marketSaturation: 'High demand, especially in rural areas',
        barriersToEntry: 'Long study duration, high cost, intense competition',
        adaptationRequired: 'Continuous medical education required',
        alternativePaths: 'Medical Research, Public Health, Medical Administration, Medical Education'
      },
      successMetrics: {
        shortTerm: 'Excel in +2 science, prepare for entrance exams',
        mediumTerm: 'Complete MBBS with good grades, pass licensing exams',
        longTerm: 'Specialize, establish practice, contribute to healthcare system',
        keyPerformanceIndicators: 'Academic performance, patient feedback, research publications'
      }
    },
    // Additional careers with similar detailed structure...
    {
      title: 'Civil Engineer',
      description: 'Design, construct, and maintain infrastructure projects including buildings, roads, bridges, and water systems. Nepal\'s infrastructure development offers significant opportunities.',
      salary: {
        entryLevel: 'NPR 25,000 - 40,000',
        midCareer: 'NPR 60,000 - 120,000',
        seniorLevel: 'NPR 120,000 - 250,000+',
        globalComparison: '$55,000 - $120,000'
      },
      growth: {
        nepalMarket: 'High with reconstruction and development projects',
        globalTrend: 'Stable with urbanization',
        automationRisk: 'Medium',
        futureOutlook: 'Good with government infrastructure focus'
      },
      education: {
        pathway: `${grade} → +2 Science → B.E. Civil Engineering → Optional M.E.`,
        timeline: '4 years bachelor\'s + internship',
        nepalOptions: ['IOE Pulchowk/Thapathali', 'Kathmandu University', 'Pokhara University'],
        costEstimate: {
          nepal: 'NPR 600,000 - 1,500,000',
          international: '$25,000 - $60,000 per year'
        }
      }
    },
    {
      title: 'Business Management Professional',
      description: 'Plan, organize, and coordinate business activities to achieve organizational goals. Nepal\'s growing private sector offers diverse opportunities in various industries.',
      salary: {
        entryLevel: 'NPR 20,000 - 35,000',
        midCareer: 'NPR 50,000 - 100,000',
        seniorLevel: 'NPR 100,000 - 300,000+',
        globalComparison: '$50,000 - $150,000'
      },
      growth: {
        nepalMarket: 'High with economic growth',
        globalTrend: 'Stable',
        automationRisk: 'Medium',
        futureOutlook: 'Good across sectors'
      }
    },
    {
      title: 'Tourism & Hospitality Manager',
      description: 'Manage hotels, resorts, travel agencies, and tourism services. Nepal\'s tourism industry is a major economic contributor with growth potential.',
      salary: {
        entryLevel: 'NPR 18,000 - 30,000',
        midCareer: 'NPR 40,000 - 80,000',
        seniorLevel: 'NPR 80,000 - 200,000+',
        globalComparison: '$40,000 - $100,000'
      },
      growth: {
        nepalMarket: 'Medium with tourism recovery',
        globalTrend: 'Growing',
        automationRisk: 'Low',
        futureOutlook: 'Good with sustainable tourism focus'
      }
    },
    {
      title: 'Agricultural Scientist',
      description: 'Improve agricultural productivity, sustainability, and food security through scientific research and innovation. Nepal\'s agrarian economy needs modernization.',
      salary: {
        entryLevel: 'NPR 20,000 - 35,000',
        midCareer: 'NPR 45,000 - 80,000',
        seniorLevel: 'NPR 80,000 - 150,000+',
        globalComparison: '$45,000 - $90,000'
      },
      growth: {
        nepalMarket: 'Medium with government focus',
        globalTrend: 'Growing with climate challenges',
        automationRisk: 'Low',
        futureOutlook: 'Good with technology integration'
      }
    }
  ];

  // Filter careers based on profile interests if possible
  let filteredCareers = [...careersLibrary];

  if (interest) {
    const interestKeywords = {
      'tech': ['software', 'computer', 'programming', 'developer', 'engineer'],
      'medical': ['doctor', 'medical', 'health', 'nurse', 'surgery'],
      'engineering': ['civil', 'mechanical', 'electrical', 'engineer'],
      'business': ['business', 'management', 'finance', 'marketing'],
      'arts': ['design', 'artist', 'creative', 'writer'],
      'science': ['scientist', 'research', 'lab', 'biology']
    };

    for (const [key, keywords] of Object.entries(interestKeywords)) {
      if (interest.includes(key) || keywords.some(kw => interest.includes(kw))) {
        filteredCareers = careersLibrary.filter(career =>
          keywords.some(kw => career.title.toLowerCase().includes(kw))
        );
        break;
      }
    }
  }

  // Ensure exactly 6 careers
  if (filteredCareers.length < 6) {
    filteredCareers = [
      ...filteredCareers,
      ...careersLibrary.slice(0, 6 - filteredCareers.length)
    ];
  } else if (filteredCareers.length > 6) {
    filteredCareers = filteredCareers.slice(0, 6);
  }

  // Calculate fit scores for each career
  const careersWithFitScores = filteredCareers.map((career, index) => {
    let fitScore = 50;
    let matchExplanation = 'This career could be a good match for your profile.';

    const careerTitle = career.title.toLowerCase();
    const profileInterests = [interest, ...(profile?.academicInterests || [])].map((s: any) => (s || '').toLowerCase());
    const profileStrengths = (profile?.academicStrengths || []).map((s: any) => s.toLowerCase());

    // Boost score if matches primary interest
    if (profileInterests.some(p => careerTitle.includes(p) || p.includes(careerTitle.split(' ')[0]))) {
      fitScore += 25;
      matchExplanation = `Matches your interest in ${profile?.careerInterest || 'this field'}.`;
    }

    // Boost for top recommendations
    if (index === 0) {
      fitScore = Math.min(95, fitScore + 15);
    } else if (index === 1) {
      fitScore = Math.min(88, fitScore + 10);
    } else if (index <= 3) {
      fitScore = Math.min(80, fitScore + 5);
    }

    // Add Nepal opportunities and remote work details
    const nepalOpportunities = (() => {
      if (careerTitle.includes('software') || careerTitle.includes('developer')) {
        return 'High demand in Kathmandu tech hub. Companies like Dius Solutions, Leapfrog, F1Soft hiring. Remote work opportunities with international firms.';
      }
      if (careerTitle.includes('doctor') || careerTitle.includes('medical')) {
        return 'Severe shortage in rural areas. Government hospitals, private clinics, NGOs actively hiring. Government programs for rural deployment.';
      }
      if (careerTitle.includes('engineer') || careerTitle.includes('civil')) {
        return 'Massive infrastructure projects nationwide. Government agencies, construction companies, consulting firms all hiring.';
      }
      if (careerTitle.includes('tourism') || careerTitle.includes('hospitality')) {
        return 'Growing industry post-COVID. Hotels, travel agencies, airlines expanding. Opportunities in Kathmandu, Pokhara, and mountain regions.';
      }
      return 'Various opportunities available across industries in urban and semi-urban areas.';
    })();

    const remoteWork = (() => {
      if (careerTitle.includes('software') || careerTitle.includes('developer') || careerTitle.includes('programmer')) {
        return 'Yes - Highly suitable. Many Nepali developers work remotely for international companies earning USD salaries.';
      }
      if (careerTitle.includes('business') || careerTitle.includes('management') || careerTitle.includes('consultant')) {
        return 'Partially - Depends on role. Management can be remote, but often requires office presence.';
      }
      if (careerTitle.includes('data') || careerTitle.includes('analyst')) {
        return 'Yes - Fully remote positions available with international companies and startups.';
      }
      return 'Varies by specific role and company.';
    })();

    return {
      ...career,
      fitScore,
      matchExplanation,
      nepalOpportunities,
      remoteWork
    };
  });

  return careersWithFitScores;
}
