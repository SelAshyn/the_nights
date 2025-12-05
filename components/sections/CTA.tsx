'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

export const CTA = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-teal-900">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div
          className="relative isolate overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16"
          data-aos="zoom-in"
        >
          <h2
            className="mx-auto max-w-2xl text-4xl font-heading font-bold tracking-normal text-white sm:text-5xl leading-20"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Start Using <span className="text-slate-900">UNITE</span> Today
          </h2>
          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-8 text-teal-100 font-body"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Get instant access to expert mentors and personalized guidance. Sign up now and accelerate your career journey.
          </p>
          <div
            className="mt-10 flex items-center justify-center gap-x-6"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-7 py-3.5 text-lg font-semibold bg-white text-teal-600 rounded-lg shadow-lg hover:bg-teal-50 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600"
            >
              Get Started
            </button>
            <button
              className="px-7 py-3.5 text-lg font-semibold bg-transparent text-white border-2 border-white rounded-lg shadow-lg hover:bg-white/10 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-600"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </button>
          </div>
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle cx={512} cy={512} r={512} fill="url(#gradient-cta)" fillOpacity="0.4" />
            <defs>
              <radialGradient id="gradient-cta">
                <stop stopColor="#fff" />
                <stop offset={1} stopColor="#14b8a6" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-700 overflow-hidden animate-scale-up">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-heading font-bold text-white mb-2">Choose Your Path</h3>
                <p className="text-slate-300">Select how you'd like to join MentorLaunch</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mentee Option */}
                <Link href="/auth/mentee" className="group">
                  <div className="relative p-8 rounded-2xl border-2 border-teal-500/30 hover:border-teal-500 bg-gradient-to-br from-teal-900/30 to-cyan-900/30 hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 cursor-pointer">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎓</div>
                      <h4 className="text-2xl font-bold text-white mb-2">I'm a Mentee</h4>
                      <p className="text-slate-300 text-sm mb-4">
                        Get personalized career guidance, explore opportunities, and connect with expert mentors
                      </p>
                      <div className="inline-flex items-center text-teal-400 font-semibold group-hover:gap-2 transition-all">
                        Continue as Mentee
                        <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Mentor Option */}
                <Link href="/auth/mentor" className="group">
                  <div className="relative p-8 rounded-2xl border-2 border-cyan-500/30 hover:border-cyan-500 bg-gradient-to-br from-cyan-900/30 to-teal-900/30 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👨‍🏫</div>
                      <h4 className="text-2xl font-bold text-white mb-2">I'm a Mentor</h4>
                      <p className="text-slate-300 text-sm mb-4">
                        Share your expertise, guide students, and make a meaningful impact on their careers
                      </p>
                      <div className="inline-flex items-center text-cyan-400 font-semibold group-hover:gap-2 transition-all">
                        Continue as Mentor
                        <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              <button
                onClick={() => setShowRoleModal(false)}
                className="mt-6 w-full py-3 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
