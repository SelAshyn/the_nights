'use client';

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { useState } from "react";
import { useRouter } from "next/navigation";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
});

const navigation = [
  { name: "Features", href: "#features" },
];

export const Navbar = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRoleSelect = (role: 'mentor' | 'mentee') => {
    localStorage.setItem('userRole', role);
    setShowRoleModal(false);
    if (role === 'mentor') {
      router.push('/auth/mentor');
    } else {
      router.push('/auth/mentee');
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-teal-500/20">
        <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" width="40px" height="40px" className="lg:w-[50px] lg:h-[50px]"/>
              <span className={`${poppins.className} text-xl lg:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-wide`}>UNITE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-x-8 lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={`${poppins.className} font-semibold leading-6 text-sm lg:text-base text-white hover:text-teal-400 transition-colors cursor-pointer tracking-wide`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              size="sm"
              className={`${poppins.className} font-semibold`}
              onClick={() => setShowRoleModal(true)}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-teal-500/20 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    scrollToSection(e, item.href);
                    setMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 rounded-lg text-white hover:bg-slate-700 hover:text-teal-400 font-semibold transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setShowRoleModal(true);
                  setMobileMenuOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowRoleModal(false)}
          ></div>
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full p-8 transform animate-scale-up relative">
            <div className="text-center mb-8">
              <h2 className={`${poppins.className} text-3xl font-bold text-white mb-2`}>
                Choose Your Path
              </h2>
              <p className="text-slate-300">
                Are you here to guide others or seeking guidance?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mentee Option */}
              <button
                onClick={() => handleRoleSelect('mentee')}
                className="group relative bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border-2 border-teal-500/30 rounded-2xl p-8 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 text-left"
              >
                <div className="absolute top-4 right-4 text-4xl">🎓</div>
                <h3 className={`${poppins.className} text-2xl font-bold text-white mb-3`}>
                  Mentee
                </h3>
                <p className="text-slate-300 mb-4">
                  I'm a student looking for career guidance and mentorship
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start">
                    <span className="text-teal-400 mr-2">✓</span>
                    <span>Get personalized career suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-teal-400 mr-2">✓</span>
                    <span>Connect with experienced mentors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-teal-400 mr-2">✓</span>
                    <span>Build your career roadmap</span>
                  </li>
                </ul>
                <div className="mt-6 text-teal-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center">
                  Continue as Mentee
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Mentor Option */}
              <button
                onClick={() => handleRoleSelect('mentor')}
                className="group relative bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-2 border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 text-left"
              >
                <div className="absolute top-4 right-4 text-4xl">👨‍🏫</div>
                <h3 className={`${poppins.className} text-2xl font-bold text-white mb-3`}>
                  Mentor
                </h3>
                <p className="text-slate-300 mb-4">
                  I'm a professional ready to guide and inspire students
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">✓</span>
                    <span>Share your expertise and experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">✓</span>
                    <span>Help students achieve their goals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">✓</span>
                    <span>Make a lasting impact</span>
                  </li>
                </ul>
                <div className="mt-6 text-cyan-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center">
                  Continue as Mentor
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scale-up {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-scale-up {
          animation: scale-up 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};
