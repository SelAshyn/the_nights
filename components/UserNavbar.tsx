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

export const UserNavbar = () => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userGrade, setUserGrade] = useState('');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    const loadUserData = () => {
      const grade = localStorage.getItem('userGrade') || '';
      const interests = JSON.parse(localStorage.getItem('userInterests') || '[]');
      setUserGrade(grade);
      setUserInterests(interests);
    };

    loadUserData();
    getUser();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userGrade' || e.key === 'userInterests') {
        loadUserData();
      }
    };

    // Listen for custom event when data is updated in the same tab
    const handleDataUpdate = () => {
      loadUserData();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userDataUpdated', handleDataUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleDataUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      // Get user ID before signing out to clear user-specific data
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      // Clear all localStorage data
      if (userId) {
        const userKey = (key: string) => `${key}_${userId}`;
        localStorage.removeItem(userKey('fullQuizData'));
        localStorage.removeItem(userKey('careerSuggestions'));
        localStorage.removeItem(userKey('savedCareers'));
      }

      // Clear legacy keys
      localStorage.removeItem('userGrade');
      localStorage.removeItem('userInterests');
      localStorage.removeItem('fullQuizData');
      localStorage.removeItem('careerSuggestions');
      localStorage.removeItem('savedCareers');

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/40 backdrop-blur-sm border-b border-gray-100">
      <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
        <div className="flex items-center gap-2">
          <Link href="/user" className="flex items-center gap-2">
            <img src="/logo.svg" width="35px" height="35px" className="lg:w-[45px] lg:h-[45px]" />
            <span className={`${poppins.className} text-lg lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wide`}>MentorLaunch</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/user"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/user/plans"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          >
            📚 My Plans
          </Link>
          <Link
            href="/user/saved"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          >
            ⭐ Saved
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
              className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm lg:text-base">
                {getInitials(userName)}
              </div>
              <span className="hidden lg:block text-slate-700 font-semibold">{userName}</span>
              <svg
                className={`hidden lg:block w-4 h-4 text-slate-600 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-scale-up">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl">
                      {getInitials(userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎓</span>
                        <h3 className={`${poppins.className} text-lg font-bold truncate`}>{userName}</h3>
                      </div>
                      <p className="text-sm text-white/90 truncate">{user?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎓</span>
                      <h4 className="font-semibold text-slate-900">Grade Level</h4>
                    </div>
                    <p className="text-slate-700 font-medium">{userGrade || 'Not set'}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💡</span>
                      <h4 className="font-semibold text-slate-900">Interests</h4>
                    </div>
                    {userInterests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userInterests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No interests set</p>
                    )}
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={() => {
                        setShowAccountMenu(false);
                        router.push('/welcome');
                      }}
                      variant="outline"
                      className="w-full justify-center"
                      size="sm"
                    >
                      Update Preferences
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full justify-center text-red-600 hover:bg-red-50 hover:border-red-300"
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
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/user"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-indigo-600 font-semibold transition-colors"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/user/plans"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-indigo-600 font-semibold transition-colors"
            >
              📚 My Plans
            </Link>
            <Link
              href="/user/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-indigo-600 font-semibold transition-colors"
            >
              ⭐ Saved
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
          animation: scale-up 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

