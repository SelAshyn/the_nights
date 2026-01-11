'use client';


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

    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (userId) {
          const userKey = (key: string) => `${key}_${userId}`;

          // Try to load from user-specific localStorage first
          const fullQuizDataStr = localStorage.getItem(userKey('fullQuizData'));
          if (fullQuizDataStr) {
            const fullQuizData = JSON.parse(fullQuizDataStr);
            setUserGrade(fullQuizData.grade || '');
            setUserInterests(fullQuizData.academicInterests || []);
            return;
          }
        }

        // Fallback to legacy keys
        const grade = localStorage.getItem('userGrade') || '';
        const interests = JSON.parse(localStorage.getItem('userInterests') || '[]');
        setUserGrade(grade);
        setUserInterests(interests);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    getUser();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userGrade' || e.key === 'userInterests' || e.key?.includes('fullQuizData')) {
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
    <header className="fixed inset-x-0 top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-teal-500/20">
      <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
        <div className="flex items-center gap-2">
          <Link href="/user" className="flex items-center gap-2">
            <img src="/logo.svg" width="50px" height="45px" className="lg:w-[45px] lg:h-[45px]" />
            <span className={`${poppins.className} text-lg lg:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-wide`}>UNITE</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/user"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-teal-500/10 transition-all"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/user/plans"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-teal-500/10 transition-all"
          >
            📚 My Plans
          </Link>
          <Link
            href="/user/saved"
            className="px-3 lg:px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-teal-400 hover:bg-teal-500/10 transition-all"
          >
            ⭐ Saved
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Grade Level & Interests Display */}
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-teal-500/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-full hover:bg-teal-500/10 transition-all border border-transparent hover:border-teal-500/30"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm lg:text-base shadow-lg shadow-teal-500/20">
                {getInitials(userName)}
              </div>
              <span className="hidden lg:block text-white font-semibold">{userName}</span>
              <svg
                className={`hidden lg:block w-4 h-4 text-slate-400 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-500/30 overflow-hidden animate-scale-up">
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shadow-lg">
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
                  <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 border border-teal-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎓</span>
                      <h4 className="font-semibold text-white">Grade Level</h4>
                    </div>
                    <p className="text-teal-400 font-medium">{userGrade || 'Not set'}</p>
                  </div>

                  <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 border border-teal-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💡</span>
                      <h4 className="font-semibold text-white">Interests</h4>
                    </div>
                    {userInterests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userInterests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/30"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No interests set</p>
                    )}
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={() => {
                        setShowAccountMenu(false);
                        router.push('/welcome');
                      }}
                      className="w-full justify-center bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
                      size="sm"
                    >
                      Update Preferences
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/50 border-slate-600"
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
        <div className="md:hidden bg-slate-800/95 backdrop-blur-md border-t border-teal-500/20 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Profile Info */}
            <div className="pb-3 border-b border-teal-500/20 space-y-2">
              {userGrade && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-teal-500/30">
                  <span className="text-sm">🎓</span>
                  <span className="text-sm font-semibold text-teal-400">{userGrade}</span>
                </div>
              )}
              {userInterests.length > 0 && (
                <div className="px-3 py-2 bg-slate-700/50 rounded-lg border border-teal-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">💡</span>
                    <span className="text-xs font-semibold text-white">Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {userInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-xs font-medium border border-teal-500/30"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/user"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-teal-500/10 hover:text-teal-400 font-semibold transition-all border border-transparent hover:border-teal-500/30"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/user/plans"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-teal-500/10 hover:text-teal-400 font-semibold transition-all border border-transparent hover:border-teal-500/30"
            >
              📚 My Plans
            </Link>
            <Link
              href="/user/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-teal-500/10 hover:text-teal-400 font-semibold transition-all border border-transparent hover:border-teal-500/30"
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

