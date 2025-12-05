'use client';

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

export const Hero = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);


  return (

    <div className="relative isolate pt-14 bg-white" >
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <svg
          className="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]"
          viewBox="0 0 1155 678"
        >
          <path
            fill="url(#gradient-hero)"
            fillOpacity=".3"
            d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
          />
          <defs>
            <linearGradient
              id="gradient-hero"
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
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          <div
            className="flex items-center gap-x-2 mb-4"
            data-aos="fade-down"
            data-aos-delay="100"
          >
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              “Because ‘IDK Yet’ Isn’t a Major.”
            </span>
          </div>
          <h1
            className="mt-10 max-w-lg text-5xl font-heading font-bold tracking-tight text-slate-900 sm:text-7xl"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Launch Your Future{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">With MentorLaunch</span>
          </h1>
          <p
            className="mt-6 text-xl leading-8 text-slate-600 font-body"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            Connect with expert mentors, get personalized guidance, and accelerate your career growth with MentorLaunch.
          </p>
          <div
            className="mt-10 flex items-center gap-x-6"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <Button size="lg" onClick={() => setShowRoleModal(true)}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>
        </div>
        <div
          className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow"
          data-aos="fade-left"
          data-aos-delay="500"
        >
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <img src="/logo.svg" width="400px" height="400px" />
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-heading font-bold text-slate-900 mb-2">Choose Your Path</h3>
                <p className="text-slate-600">Select how you'd like to join MentorLaunch</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mentee Option */}
                <Link href="/auth/mentee" className="group">
                  <div className="relative p-8 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎓</div>
                      <h4 className="text-2xl font-bold text-slate-900 mb-2">I'm a Mentee</h4>
                      <p className="text-slate-600 text-sm mb-4">
                        Get personalized career guidance, explore opportunities, and connect with expert mentors
                      </p>
                      <div className="inline-flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all">
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
                  <div className="relative p-8 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👨‍🏫</div>
                      <h4 className="text-2xl font-bold text-slate-900 mb-2">I'm a Mentor</h4>
                      <p className="text-slate-600 text-sm mb-4">
                        Share your expertise, guide students, and make a meaningful impact on their careers
                      </p>
                      <div className="inline-flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
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
                className="mt-6 w-full py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
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
