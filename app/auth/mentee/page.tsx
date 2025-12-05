'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function MenteeAuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

        // 🔐 Supabase sign-up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              role: 'mentee',
              full_name: fullName
            }
          }
        });

        if (signUpError) throw signUpError;

        alert('Account created successfully! Please sign in.');
        setIsSignUp(false);

      } else {
        // 🔐 Sign in
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (signInError) throw signInError;

        if (!data.session) {
          throw new Error('No session created after signing in');
        }

        // 🎯 Check if quiz is already completed
        const { data: quizData } = await supabase
          .from('user_quiz_results')
          .select('id')
          .eq('user_id', data.session.user.id)
          .single();

        // 🔀 Redirect based on quiz status
        if (quizData) {
          router.push('/user');
        } else {
          router.push('/welcome');
        }

        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
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
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="text-xl">🎓</span>
            Student Portal
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-slate-900">
            {isSignUp ? "Start Your Journey" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-base text-slate-600 font-body">
            {isSignUp ? "Create your account to discover your career path" : "Sign in to continue your career exploration"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-sm px-6 py-8 shadow-2xl sm:rounded-2xl sm:px-12 border border-indigo-100">
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
                    className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm transition-colors text-slate-900"
                  />
                </div>
              </div>
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
                  className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm transition-colors text-slate-900"
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
                  className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm transition-colors text-slate-900"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full shadow-lg"
                isLoading={loading}
              >
                {isSignUp ? "Create Account" : "Sign in"}
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
              className="mt-6 w-full text-center text-base text-indigo-600 hover:text-indigo-700 font-semibold transition-colors font-body"
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
            fill="url(#gradient-mentee)"
            fillOpacity=".3"
            d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
          />
          <defs>
            <linearGradient
              id="gradient-mentee"
              x1="1155.49"
              x2="-78.208"
              y1=".177"
              y2="474.645"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6366f1" />
              <stop offset={1} stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

