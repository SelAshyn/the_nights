'use client';

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const MentorNavbar = () => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mentor, setMentor] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const getMentor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setMentor(session.user);
      }
    };

    getMentor();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'M';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const mentorName = mentor?.user_metadata?.full_name || 'Mentor';
  const profession = mentor?.user_metadata?.profession || '';
  const experience = mentor?.user_metadata?.experience || '';

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/40 backdrop-blur-sm border-b border-black">
      <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
        <div className="flex items-center gap-2">
          <Link href="/mentor/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" width="35px" height="35px" className="lg:w-[50px] lg:h-[50px]" />
            <span className={`${poppins.className} text-lg lg:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-wide`}>UNITE</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-x-4 lg:gap-x-8">
          <Link
            href="/mentor/dashboard"
            className={`${poppins.className} font-semibold leading-6 text-sm lg:text-base text-white-700 hover:text-teal-400 transition-colors tracking-wide`}
          >
            Dashboard
          </Link>
          <Link
            href="/mentor/mentees"
            className={`${poppins.className} font-semibold leading-6 text-sm lg:text-base text-white-700 hover:text-teal-400 transition-colors tracking-wide`}
          >
            My Mentees
          </Link>
          <Link
            href="/mentor/messages"
            className={`${poppins.className} font-semibold leading-6 text-sm lg:text-base text-white-700 hover:text-teal-400 transition-colors tracking-wide`}
          >
            Messages
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-purple-50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Account Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 rounded-full hover:bg-teal-50 transition-colors"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm lg:text-base shadow-lg shadow-teal-500/30">
                {getInitials(mentorName)}
              </div>
              <span className="hidden lg:block text-white font-semibold">{mentorName}</span>
              <svg
                className={`hidden lg:block w-4 h-4 text-white transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-slate-800 rounded-2xl shadow-xl border border-teal-500/30 overflow-hidden animate-scale-up">
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30">
                      {getInitials(mentorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">👨‍🏫</span>
                        <h3 className={`${poppins.className} text-lg font-bold truncate`}>{mentorName}</h3>
                      </div>
                      <p className="text-sm text-white/90 truncate">{mentor?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {profession && (
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">💼</span>
                        <h4 className="font-semibold text-white">Profession</h4>
                      </div>
                      <p className="text-slate-300 font-medium">{profession}</p>
                    </div>
                  )}

                  {experience && (
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-teal-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⭐</span>
                        <h4 className="font-semibold text-white">Experience</h4>
                      </div>
                      <p className="text-slate-300 font-medium">{experience}</p>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={() => {
                        setShowAccountMenu(false);
                        router.push('/mentor/profile');
                      }}
                      variant="outline"
                      className="w-full justify-center border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                      size="sm"
                    >
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                      size="sm"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-purple-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/mentor/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-purple-50 hover:text-purple-600 font-semibold transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/mentor/mentees"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-purple-50 hover:text-purple-600 font-semibold transition-colors"
            >
              My Mentees
            </Link>
            <Link
              href="/mentor/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-purple-50 hover:text-purple-600 font-semibold transition-colors"
            >
              Messages
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scale-up {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-scale-up {
          animation: s-up 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

