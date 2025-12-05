'use client';

import { Scan, Pill, Clock, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import AOS from 'aos';
import 'aos/dist/aos.css';

const features = [
  {
    name: "AI Career Suggestions",
    description: "Get personalized career recommendations based on your interests, skills, and academic profile with detailed insights.",
    icon: Scan,
  },
  {
    name: "Real-Time Mentorship",
    description: "Connect instantly with expert mentors through our live chat system for guidance and career advice.",
    icon: Clock,
  },
  {
    name: "Scholarship Finder",
    description: "Discover universities offering 70-100% scholarships worldwide, tailored to your career goals and financial needs.",
    icon: Pill,
  },
  {
    name: "MentorAssist AI",
    description: "Chat with our AI assistant for study plans, budgeting tips, skill development roadmaps, and personalized guidance.",
    icon: ShieldCheck,
  },
];

export const Features = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  return (
    <div id="features" className="py-24 sm:py-32 scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2
            className="text-base font-semibold leading-7 text-indigo-600 font-display"
            data-aos="fade-down"
          >
            Powerful Features
          </h2>
          <p
            className="mt-2 text-4xl font-heading font-bold tracking-tight text-slate-900 sm:text-5xl"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Everything you need for career success
          </p>
          <p
            className="mt-6 text-lg leading-8 text-slate-600 font-body"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Our platform provides comprehensive career tools and guidance to help you achieve your professional goals.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="flex flex-col"
                data-aos="fade-up"
                data-aos-delay={300 + (index * 100)}
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 font-heading">
                  <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2">
                    <feature.icon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 font-body">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};
