'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function MentorAuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [credentials, setCredentials] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateEmailClient = (email: string): string | null => {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    // Trusted domains whitelist
    const trustedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
      'zoho.com', 'yandex.com', 'gmx.com', 'live.com', 'msn.com',
      'yahoo.co.uk', 'yahoo.co.in', 'outlook.co.uk', 'googlemail.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (!trustedDomains.includes(domain)) {
      return 'Please use an email from Gmail, Yahoo, Outlook, or other recognized providers';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Client-side validation first
        const clientError = validateEmailClient(email);
        if (clientError) {
          setError(clientError);
          setLoading(false);
          return;
        }

        // 🔍 Verify email with API (optional additional check)
        try {
          const verifyResponse = await fetch('/api/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            console.log('Email verification result:', verifyData);

            if (!verifyData.valid) {
              setError(verifyData.error || 'Invalid email address');
              setLoading(false);
              return;
            }
          }
        } catch (verifyError: any) {
          console.error('Email verification API error:', verifyError);
          // Continue with client-side validation only
        }

        // 🔐 Supabase mentor sign-up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              role: 'mentor',
              full_name: fullName,
              profession: profession,
              experience: experience,
              company: company,
              linkedin_url: linkedinUrl,
              credentials: credentials,
              verification_status: 'pending'
            }
          }
        });

        if (signUpError) throw signUpError;

        alert(
          'Account created! Your mentor application is now under review. Please sign in to check your status.'
        );
        setIsSignUp(false);

      } else {
        // 🔐 Mentor sign-in
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (signInError) throw signInError;

        if (!data.session) {
          throw new Error('No session created after sign in');
        }

        // 🔀 Redirect to mentor dashboard
        router.push('/mentor/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <img src="/logo.svg" width="64px" height="64px" />
        </div>
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="text-xl">👨‍🏫</span>
            Mentor Portal
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-slate-900">
            {isSignUp ? "Join as a Mentor" : "Welcome Back, Mentor"}
          </h2>
          <p className="mt-2 text-base text-slate-600 font-body">
            {isSignUp ? "Share your expertise and guide the next generation" : "Sign in to continue mentoring"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm px-6 py-8 shadow-2xl sm:rounded-2xl sm:px-12 border border-purple-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 font-body">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 font-body">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-slate-700 font-body">
                    Profession / Job Title
                  </label>
                  <div className="mt-1">
                    <input
                      id="profession"
                      name="profession"
                      type="text"
                      required
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="e.g., Software Engineer, Doctor, Business Analyst"
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-slate-700 font-body">
                    Years of Experience
                  </label>
                  <div className="mt-1">
                    <select
                      id="experience"
                      name="experience"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    >
                      <option value="">Select experience</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 font-body">
                    Current Company / Organization
                  </label>
                  <div className="mt-1">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g., Google, Stanford University, Self-employed"
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-slate-700 font-body">
                    LinkedIn Profile URL
                  </label>
                  <div className="mt-1">
                    <input
                      id="linkedinUrl"
                      name="linkedinUrl"
                      type="url"
                      required
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">We'll verify your professional background</p>
                </div>

                <div>
                  <label htmlFor="credentials" className="block text-sm font-medium text-slate-700 font-body">
                    Professional Credentials / Certifications
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="credentials"
                      name="credentials"
                      rows={3}
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      placeholder="List your degrees, certifications, or professional achievements (optional)"
                      className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-800">Verification Process</h3>
                      <p className="mt-1 text-sm text-purple-700">
                        Your application will be reviewed within 24-48 hours. We'll verify your LinkedIn profile and professional background to ensure quality mentorship.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 font-body">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 font-body">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm transition-colors text-slate-900"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                isLoading={loading}
              >
                {isSignUp ? "Create Mentor Account" : "Sign in as Mentor"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/90 px-3 text-slate-500 font-body">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-base text-purple-600 hover:text-purple-700 font-semibold transition-colors font-body"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <svg
          className="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]"
          viewBox="0 0 1155 678"
        >
          <path
            fill="url(#gradient-mentor)"
            fillOpacity=".3"
            d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
          />
          <defs>
            <linearGradient
              id="gradient-mentor"
              x1="1155.49"
              x2="-78.208"
              y1=".177"
              y2="474.645"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#9333ea" />
              <stop offset={1} stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

