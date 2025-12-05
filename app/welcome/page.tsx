// Enhanced multi-step quiz page rewritten based on user's request
// Next.js (app router) - page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export default function EnhancedQuizPage() {
  const router = useRouter();

  const [step, setStep] = useState(0); // 0 = welcome, 1 = grade, 2 = career, 3–N = extended quiz

  const [cursorMoved, setCursorMoved] = useState(false);

  // FORM STATES
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');

  // Additional quiz fields
  const [favSubjects, setFavSubjects] = useState<string[]>([]);
  const [bestSubjects, setBestSubjects] = useState<string[]>([]);
  const [workEnvironment, setWorkEnvironment] = useState('');
  const [taskPreference, setTaskPreference] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [techConfidence, setTechConfidence] = useState('');
  const [workLife, setWorkLife] = useState('');
  const [careerMotivation, setCareerMotivation] = useState('');
  const [studyGoal, setStudyGoal] = useState('');

  // Helper for multi-select
  const toggleSelect = (value: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  // ---- Check if user has already completed quiz ----
  useEffect(() => {
    const checkQuizCompletion = () => {
      const fullQuizData = localStorage.getItem('fullQuizData');
      if (fullQuizData) {
        // User has already completed the quiz, redirect to dashboard
        router.push('/user');
      }
    };

    checkQuizCompletion();
  }, [router]);

  // ---- Cursor detection ----
  useEffect(() => {
    const handleMouseMove = () => {
      if (!cursorMoved) setCursorMoved(true);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorMoved]);

  // ---- Auto-transition from welcome ----
  useEffect(() => {
    if (cursorMoved && step === 0) {
      const timer = setTimeout(() => setStep(1), 2000);
      return () => clearTimeout(timer);
    }
  }, [cursorMoved, step]);

  const goNext = () => setStep(step + 1);
  const goBack = () => setStep(step - 1);

  // ---- Final Submit ----
  const handleSubmitAll = async () => {
    const quizData = {
      grade: selectedGrade,
      careerInterest: selectedCareer,
      academicInterests: favSubjects,
      academicStrengths: bestSubjects,
      preferredEnvironment: workEnvironment,
      taskPreference,
      skills,
      techConfidence,
      workLife,
      careerMotivation,
      studyGoal,
    };

    // Save to localStorage (for backward compatibility)
    localStorage.setItem('fullQuizData', JSON.stringify(quizData));
    localStorage.setItem('userGrade', selectedGrade);
    localStorage.setItem('userInterests', JSON.stringify(favSubjects));

    // Save to database
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/quiz/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(quizData),
        });

        if (!response.ok) {
          console.error('Failed to save quiz to database');
        }
      }
    } catch (error) {
      console.error('Error saving quiz to database:', error);
    }

    // Dispatch event to update navbar
    window.dispatchEvent(new Event('userDataUpdated'));

    router.push('/user');
  };

  // ---- UI Reusable Components ----
  const Section = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="text-center mb-8">
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      {subtitle && <p className="text-slate-300 text-sm">{subtitle}</p>}
    </div>
  );

  const CardButton = ({ label, selected, onClick, className }: { label: string; selected: boolean; onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3.5 rounded-lg border transition-all duration-150 text-sm font-medium text-left ${selected ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'border-slate-600 hover:bg-slate-700 text-slate-300 hover:border-teal-500/50'
        } ${className || ''}`}
    >
      {label}
    </button>
  );

  const MultiSelect = ({ options, list, setList }: { options: string[]; list: string[]; setList: (v: string[]) => void }) => (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => toggleSelect(opt, list, setList)}
          className={`w-full px-4 py-3.5 rounded-lg border transition-all duration-150 text-sm font-medium text-left ${list.includes(opt)
              ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/20'
              : 'border-slate-600 hover:border-teal-500/50 hover:bg-slate-700 text-slate-300'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  // ---- MAIN SCREEN RENDER ----
  return (
    <div className={`${inter.className} flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-900 via-slate-900 to-teal-900 relative p-4`}>
      {/* Welcome Screen */}
      {step === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-6xl md:text-7xl font-light animate-fade bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Welcome to <span className='text-navy'>UNITE</span></h1>
        </div>
      )}

      {/* Step 1 – Academic Level */}
      {step === 1 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section
            title="Select Your Academic Level"
            subtitle="This helps us tailor your experience."
          />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {["Grade 8", "Grade 9", "Grade 10 (Secondary)", "Grade 11", "Grade 12", "Gap Year", "Undergraduate", "Graduate", "Professional"].map(
              (g) => (
                <CardButton
                  key={g}
                  label={g}
                  selected={selectedGrade === g}
                  onClick={() => setSelectedGrade(g)}
                />
              )
            )}
          </div>

          <button
            className={`w-full py-3.5 rounded-lg font-semibold text-sm ${selectedGrade ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            disabled={!selectedGrade}
            onClick={goNext}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2 – Primary Career Interest */}
      {step === 2 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section
            title="What Career Path Inspires You?"
            subtitle="Choose the field that excites you most."
          />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {[
              'Engineering & Technology',
              'Medicine & Healthcare',
              'Business, Management & Finance',
              'Computer Science & IT',
              'Creative Arts, Media & Design',
              'Law, Governance & Public Policy',
              'Education & Teaching',
              'Science, Research & Innovation',
              'Communication & Journalism',
              'Social Sciences & Psychology',
              'Architecture & Urban Planning',
              'Entrepreneurship & Startups',
              'I am Not Sure Yet',
            ].map((career) => (
              <CardButton
                key={career}
                label={career}
                selected={selectedCareer === career}
                onClick={() => setSelectedCareer(career)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${selectedCareer ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              disabled={!selectedCareer}
              onClick={goNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 – Favorite Subjects */}
      {step === 3 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section
            title="Which Subjects Do You Enjoy?"
            subtitle="Select all that apply."
          />

          <div className="flex-1 overflow-y-auto mb-6">
            <MultiSelect
              options={['Mathematics', 'Science', 'Computer Science', 'Business Studies', 'Economics', 'Arts & Design', 'Social Studies', 'Language & Literature']}
              list={favSubjects}
              setList={setFavSubjects}
            />
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${favSubjects.length ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!favSubjects.length}
              onClick={goNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4 – Best Subjects */}
      {step === 4 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section
            title="Which Subjects Do You Perform Best In?"
            subtitle="Select all that apply."
          />

          <div className="flex-1 overflow-y-auto mb-6">
            <MultiSelect
              options={['Mathematics', 'Science', 'Computer Science', 'Business', 'Arts', 'Social Sciences', 'Language Studies']}
              list={bestSubjects}
              setList={setBestSubjects}
            />
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${bestSubjects.length ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!bestSubjects.length}
              onClick={goNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 5 – Work Environment */}
      {step === 5 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section
            title="What Work Environment Fits You Best?"
            subtitle="Choose one"
          />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {[
              'Building or designing things',
              'Helping or healing people',
              'Leading teams / managing tasks',
              'Creating art / media / visuals',
              'Solving complex problems',
              'Research & experimentation',
              'Working with computers',
              'Outdoor jobs'
            ].map((env) => (
              <CardButton
                key={env}
                label={env}
                selected={workEnvironment === env}
                onClick={() => setWorkEnvironment(env)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${workEnvironment ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!workEnvironment}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 6 – Task Preference */}
      {step === 6 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="What Type of Tasks Do You Most Enjoy?" subtitle="Choose one" />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {[
              'Creative tasks',
              'Technical tasks',
              'Logical/problem solving',
              'Helping people',
              'Communication-based tasks',
              'Organizing & planning',
              'Research & analysis'
            ].map((task) => (
              <CardButton
                key={task}
                label={task}
                selected={taskPreference === task}
                onClick={() => setTaskPreference(task)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${taskPreference ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!taskPreference}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 7 – Skills */}
      {step === 7 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="Which Skills Are You Confident In?" subtitle="Select all that apply" />

          <div className="flex-1 overflow-y-auto mb-6">
            <MultiSelect
              options={['Creativity', 'Analytical thinking', 'Leadership', 'Communication', 'Empathy', 'Technical skills', 'Problem solving', 'Teamwork', 'Time management']}
              list={skills}
              setList={setSkills}
            />
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${skills.length ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!skills.length}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 8 – Tech Confidence */}
      {step === 8 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="Rate Your Confidence With Technology" subtitle="Choose one" />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {['Expert', 'Good', 'Average', 'Beginner', 'Not comfortable'].map((t) => (
              <CardButton
                key={t}
                label={t}
                selected={techConfidence === t}
                onClick={() => setTechConfidence(t)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${techConfidence ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!techConfidence}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 9 – Work Life Preference */}
      {step === 9 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="What Kind of Work-Life Balance Do You Prefer?" subtitle="Choose one" />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {['High-pay, high-demand', 'Balanced lifestyle', 'Flexibility/freedom', 'Still exploring'].map((w) => (
              <CardButton
                key={w}
                label={w}
                selected={workLife === w}
                onClick={() => setWorkLife(w)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${workLife ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!workLife}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 10 – Career Motivation */}
      {step === 10 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="What Motivates You Most In a Career?" subtitle="Choose one" />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {['Achievement', 'Recognition', 'Curiosity', 'Creativity', 'Impact on society'].map((m) => (
              <CardButton
                key={m}
                label={m}
                selected={careerMotivation === m}
                onClick={() => setCareerMotivation(m)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${careerMotivation ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!careerMotivation}
              onClick={goNext}
            >Continue</button>
          </div>
        </div>
      )}

      {/* Step 11 – Study Goal */}
      {step === 11 && (
        <div className="max-w-md w-full h-[600px] flex flex-col p-8 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-500/20 animate-slide-up">
          <Section title="How Far Do You Want To Study?" subtitle="Choose one" />

          <div className="flex-1 overflow-y-auto mb-6 space-y-2">
            {['Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Not decided'].map((s) => (
              <CardButton
                key={s}
                label={s}
                selected={studyGoal === s}
                onClick={() => setStudyGoal(s)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button className="w-1/3 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600" onClick={goBack}>Back</button>
            <button
              className={`w-2/3 py-3 rounded-lg font-semibold text-sm ${studyGoal ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              disabled={!studyGoal}
              onClick={handleSubmitAll}
            >Finish</button>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        .animate-fade {
          animation: fadeIn 2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Hide scrollbar but keep functionality */
        .overflow-y-auto {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .overflow-y-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
}

