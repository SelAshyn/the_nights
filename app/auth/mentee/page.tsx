'use client';

import { useState, useEffect } from 'react';
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
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userRole = session.user.user_metadata?.role;

          if (userRole === 'mentee') {
            // Already logged in as mentee, redirect to dashboard
            router.push('/user');
            return;
          } else if (userRole === 'mentor') {
            // Logged in as mentor, redirect to mentor dashboard
            router.push('/mentor/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkExistingAuth();
  }, [router]);

  // Show loading while checking existing auth
  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500/20 border-t-teal-500" />
      </div>
    );
  }

  // Check email availability when email changes (for sign-up only)
  const checkEmailAvailability = async (email: string) => {
    if (!email || !isSignUp) return;

    setEmailCheckLoading(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          role: 'mentee'
        }),
      });

      const result = await response.json();

      if (!result.available) {
        setError(result.message);
        return false;
      } else if (result.existing) {
        setError('This email is already registered as a mentee. Please sign in instead.');
        return false;
      }

      setError(''); // Clear any previous errors
      return true;
    } catch (error) {
      console.error('Email check failed:', error);
      return true; // Allow to proceed if check fails
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const validateEmailClient = (email: string): string | null => {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    const domain = email.split('@')[1]?.toLowerCase();

    // Trusted consumer email providers
    const trustedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'protonmail.com', 'aol.com', 'mail.com',
      'zoho.com', 'yandex.com', 'gmx.com', 'live.com', 'msn.com',
      'yahoo.co.uk', 'yahoo.co.in', 'outlook.co.uk', 'googlemail.com'
    ];

    // Check if it's a trusted consumer email
    if (trustedDomains.includes(domain)) {
      return null;
    }

    // Allow organizational/educational emails (.edu, .ac, .org, .gov, etc.)
    const organizationalTLDs = ['.edu', '.ac.', '.org', '.gov', '.mil'];
    const isOrganizational = organizationalTLDs.some(tld => domain.includes(tld));

    if (isOrganizational) {
      return null;
    }

    // Block disposable/temporary email services
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', 'guerrillamail.com',
      '10minutemail.com', 'mailinator.com', 'trashmail.com',
      'temp-mail.org', 'fakeinbox.com', 'yopmail.com'
    ];

    if (disposableDomains.includes(domain)) {
      return 'Temporary email addresses are not allowed';
    }

    // For other domains, just ensure basic validity
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Client-side validation
        const clientError = validateEmailClient(email);
        if (clientError) {
          setError(clientError);
          setLoading(false);
          return;
        }

        // Check email availability for mentee registration
        const emailAvailable = await checkEmailAvailability(email);
        if (!emailAvailable) {
          setLoading(false);
          return;
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

        if (signUpError) {
          // Handle specific error for email already registered
          if (signUpError.message.includes('already registered')) {
            setError('This email is already registered. Please sign in instead or use a different email.');
          } else {
            throw signUpError;
          }
          setLoading(false);
          return;
        }

        alert('Account created successfully! Please sign in.');
        setIsSignUp(false);

      } else {
        // 🔐 Sign in - also check if user has correct role
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password
          });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Make sure you\'re signing in to the correct portal (Student vs Mentor).');
          } else {
            throw signInError;
          }
          setLoading(false);
          return;
        }

        if (!data.session) {
          throw new Error('No session created after signing in');
        }

        // Check if user has the correct role
        const userRole = data.session.user.user_metadata?.role;
        if (userRole && userRole !== 'mentee') {
          await supabase.auth.signOut();
          setError(`This email is registered as a ${userRole}. Please use the ${userRole} portal to sign in.`);
          setLoading(false);
          return;
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
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 via-slate-900 to-teal-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <img src="/logo.svg" width="64px" height="64px" />
        </div>
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-900/50 text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-teal-500/30">
            <span className="text-xl">🎓</span>
            Student Portal
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-white">
            {isSignUp ? "Start Your Journey" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-base text-slate-300 font-body">
            {isSignUp ? "Create your account to discover your career path" : "Sign in to continue your career exploration"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-sm px-6 py-8 shadow-2xl sm:rounded-2xl sm:px-12 border border-teal-500/20">
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
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 font-body">
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
                    className="block w-full appearance-none rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm transition-colors text-white placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 font-body">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (error && error.includes('email')) {
                      setError('');
                    }
                  }}
                  onBlur={() => {
                    if (isSignUp && email) {
                      checkEmailAvailability(email);
                    }
                  }}
                  className="block w-full appearance-none rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm transition-colors text-white placeholder-slate-400"
                />
                {emailCheckLoading && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500/20 border-t-teal-500"></div>
                  </div>
                )}
              </div>
              {isSignUp && (
                <p className="mt-1 text-xs text-slate-400">
                  We'll check if this email is available for student registration
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 font-body">
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
                  className="block w-full appearance-none rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm transition-colors text-white placeholder-slate-400"
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
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-800 px-3 text-slate-400 font-body">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-base text-teal-400 hover:text-teal-300 font-semibold transition-colors font-body"
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
            fillOpacity=".2"
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
              <stop stopColor="#14b8a6" />
              <stop offset={1} stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

