'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { UserNavbar } from '@/components/UserNavbar';
import { Chat } from '@/components/Chat';

export const dynamic = 'force-dynamic';

// -------------------- Types --------------------
export type Career = {
  title: string;
  description: string;
  fitScore?: number;
  matchExplanation?: string;
  nepalOpportunities?: string;
  remoteWork?: string;
  salary?: string | {
    entryLevel: string;
    midCareer: string;
    seniorLevel: string;
    globalComparison: string;
  };
  growth?: string | {
    nepalMarket: string;
    globalTrend: string;
    automationRisk: string;
    futureOutlook: string;
  };
  education?: string | {
    pathway: string;
    timeline: string;
    nepalOptions: string[];
    internationalOptions: any[];
    costEstimate: {
      nepal: string;
      international: string;
    };
  };
  degrees?: string[] | {
    essential: string[];
    recommended: string[];
    alternative: string[];
  };
  skills?: string[] | {
    technical: string[];
    soft: string[];
    developmentPlan: string;
  };
  extracurricular?: string[] | {
    schoolLevel: string[];
    undergraduate: string[];
    online: string[];
  };
  certifications?: string[] | {
    local: string[];
    international: string[];
    online: string[];
  };
  jobTitles?: string[] | {
    entry: string[];
    mid: string[];
    senior: string[];
    entrepreneurial: string[];
  };
  universities?: string[] | any[];
  financialAdvice?: {
    budgetingTips?: string[] | string;
    savingTips?: string[] | string;
    educationCostAdvice?: string;
    scholarshipSuggestions?: string | {
      government: string[];
      university: string[];
      international: string[];
      corporate: string[];
    };
    earningWhileStudying?: string | {
      partTime: string[];
      freelance: string[];
      internships: string[];
      entrepreneurial: string[];
    };
  };
  riskAssessment?: {
    marketSaturation: string;
    barriersToEntry: string;
    adaptationRequired: string;
    alternativePaths: string;
  };
  successMetrics?: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    keyPerformanceIndicators: string;
  };
  fieldOfStudy?: string;
  topSkills?: string[];
  possibleJobTitles?: string[];
  careerPath?: string;
  salaryRange?: string;
  growthPotential?: string;
};

export type FullQuizData = {
  grade?: string;
  careerInterest?: string;
  academicInterests?: string[];
  academicStrengths?: string[];
  preferredEnvironment?: string;
  taskPreference?: string;
  skills?: string[];
  techConfidence?: string;
  workLife?: string;
  careerMotivation?: string;
  studyGoal?: string;
};

// -------------------- Utilities --------------------
function formatList(items?: string[] | any, limit = 5) {
  if (!items) return '—';

  if (Array.isArray(items)) {
    return items.slice(0, limit).filter(Boolean).join(', ') || '—';
  }

  if (typeof items === 'string') {
    return items.length > 100 ? items.substring(0, 100) + '...' : items;
  }

  // Handle object with nested arrays (e.g., certifications, jobTitles)
  if (typeof items === 'object' && !Array.isArray(items)) {
    const arrays = Object.values(items)
      .filter((v) => Array.isArray(v))
      .flat();
    if (arrays.length > 0) {
      return arrays.slice(0, limit).filter(Boolean).join(', ') || '—';
    }
  }

  return '—';
}

function formatUniversities(unis?: any[], limit = 5) {
  if (!unis) return '—';
  if (!Array.isArray(unis)) return '—';

  const names = unis
    .map((u) => typeof u === 'string' ? u : u?.name)
    .filter(Boolean)
    .slice(0, limit);

  return names.length > 0 ? names.join(', ') : '—';
}

function computeCareerScore(career: Career, profile?: FullQuizData) {
  let score = 50;
  if (!profile) return score;

  // Career interest match
  if (profile.careerInterest && career.title?.toLowerCase().includes(profile.careerInterest.toLowerCase())) {
    score += 15;
  }

  // Skills overlap
  const profileSkills = (profile.skills || []).map((s) => s.toLowerCase());

  // Get career skills from various possible structures
  const careerSkills = (() => {
    if (Array.isArray(career.skills)) return career.skills;
    if (career.skills && typeof career.skills === 'object' && 'technical' in career.skills) {
      return [...(career.skills.technical || []), ...(career.skills.soft || [])];
    }
    if (career.topSkills && Array.isArray(career.topSkills)) {
      return career.topSkills;
    }
    return [];
  })();

  const overlap = careerSkills.filter((s) =>
    s && profileSkills.includes((s || '').toLowerCase())
  );
  score += Math.min(20, overlap.length * 6);

  // Tech confidence bonus
  if (profile.techConfidence === 'High') score += 7;
  if (profile.techConfidence === 'Medium') score += 3;

  // Study goal bonus
  if (profile.studyGoal && ['bachelor', 'masters', 'phd'].some((g) =>
    (profile.studyGoal || '').toLowerCase().includes(g)
  )) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// -------------------- Enhanced Utilities --------------------
function getSalaryDisplay(salary: any): string {
  if (!salary) return 'N/A';

  if (typeof salary === 'string') {
    return salary;
  }

  if (typeof salary === 'object') {
    // Show a meaningful range - prioritize showing entry to mid-career range
    if (salary.entryLevel && salary.midCareer) {
      return `${salary.entryLevel} → ${salary.midCareer}`;
    }

    if (salary.entryLevel) {
      return salary.entryLevel;
    }

    if (salary.midCareer) {
      return salary.midCareer;
    }
  }

  return 'N/A';
}

function getGrowthDisplay(growth: any): string {
  if (!growth) return 'N/A';

  if (typeof growth === 'string') {
    return growth;
  }

  if (typeof growth === 'object') {
    if (growth.nepalMarket) {
      return `${growth.nepalMarket} (${growth.automationRisk || 'Medium'} risk)`;
    }
  }

  return 'N/A';
}

function getEducationDisplay(education: any): string {
  if (!education) return 'N/A';

  if (typeof education === 'string') {
    return education.length > 50 ? education.substring(0, 50) + '...' : education;
  }

  if (typeof education === 'object') {
    if (education.pathway) {
      return education.pathway.length > 50 ? education.pathway.substring(0, 50) + '...' : education.pathway;
    }
  }

  return 'N/A';
}

// -------------------- Hardcoded University Mapping --------------------
const HARD_CODED_UNIS: Record<string, string[]> = {
  engineering: ['Pulchowk Campus (IOE)', 'Kathmandu University', 'MIT (USA)', 'Stanford University'],
  software: ['Pulchowk Campus (IOE)', 'Kathmandu University', 'Carnegie Mellon University', 'MIT (USA)'],
  data: ['Tribhuvan University', 'Kathmandu University', 'Nanyang Technological University', 'University of Delhi'],
  business: ['Ace Institute of Management', 'Kathmandu University School of Management', 'Wharton School', 'London Business School'],
  marketing: ['Ace Institute of Management', 'Kathmandu University', 'NYU', 'UC Berkeley'],
  medicine: ['IOM (Tribhuvan University)', 'Kathmandu University School of Medical Sciences', 'Manipal College of Medical Sciences', 'Johns Hopkins University'],
  nursing: ['IOM (Tribhuvan University)', 'Kathmandu University', 'Manipal College of Medical Sciences'],
  journalism: ['Tribhuvan University', 'Columbia Journalism School', 'UCLA', 'NYU'],
  default: ['Tribhuvan University', 'Kathmandu University', 'Ace Institute of Management', 'Local Community Colleges'],
};

function getUniversitiesForCareer(title?: string): string[] {
  if (!title) return HARD_CODED_UNIS.default;
  const key = title.toLowerCase();
  if (key.includes('software') || key.includes('developer') || key.includes('programmer') || key.includes('engineer')) return HARD_CODED_UNIS.software;
  if (key.includes('data') || key.includes('analyst') || key.includes('scientist')) return HARD_CODED_UNIS.data;
  if (key.includes('business') || key.includes('consultant')) return HARD_CODED_UNIS.business;
  if (key.includes('marketing') || key.includes('digital') || key.includes('seo')) return HARD_CODED_UNIS.marketing;
  if (key.includes('nurse') || key.includes('nursing')) return HARD_CODED_UNIS.nursing;
  if (key.includes('medicine') || key.includes('doctor') || key.includes('physician')) return HARD_CODED_UNIS.medicine;
  if (key.includes('journal') || key.includes('communication') || key.includes('media')) return HARD_CODED_UNIS.journalism;
  if (key.includes('engineer')) return HARD_CODED_UNIS.engineering;
  return HARD_CODED_UNIS.default;
}

// -------------------- Comprehensive Career Detail Modal --------------------
function CareerDetailModal({ career, open, onClose }: { career: Career; open: boolean; onClose: () => void }) {
  if (!open) return null;

  const salary = typeof career.salary === 'object' ? career.salary : null;
  const growth = typeof career.growth === 'object' ? career.growth : null;
  const education = typeof career.education === 'object' ? career.education : null;
  const degrees = typeof career.degrees === 'object' ? career.degrees : null;
  const skills = typeof career.skills === 'object' ? career.skills : null;
  const extracurricular = typeof career.extracurricular === 'object' ? career.extracurricular : null;
  const certifications = typeof career.certifications === 'object' ? career.certifications : null;
  const jobTitles = typeof career.jobTitles === 'object' ? career.jobTitles : null;
  const financialAdvice = career.financialAdvice || {};
  const riskAssessment = career.riskAssessment;
  const successMetrics = career.successMetrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl border border-teal-500/30 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-teal-500/30 bg-gradient-to-r from-teal-600/20 to-cyan-600/20">
          <div>
            <h3 className="text-2xl font-bold text-white">{career.title}</h3>
            <p className="text-slate-300 mt-1">{career.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fit Score & Matching Section */}
          {(career.fitScore !== undefined || career.matchExplanation) && (
            <div className="lg:col-span-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {career.fitScore !== undefined && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-amber-600/20">
                        <span className="text-2xl font-bold text-amber-400">{career.fitScore}</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-amber-300">Your Fit Score</h5>
                      <p className="text-xs text-slate-300 mt-1">
                        {career.fitScore >= 85 ? 'Excellent match for your profile' :
                         career.fitScore >= 75 ? 'Good match with strong potential' :
                         career.fitScore >= 60 ? 'Interesting opportunity with effort' :
                         'Growth opportunity to explore'}
                      </p>
                    </div>
                  </div>
                )}
                {career.matchExplanation && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">💡</span>
                    <div>
                      <h5 className="text-sm font-semibold text-white mb-1">Why This Career?</h5>
                      <p className="text-sm text-slate-300">{career.matchExplanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Left Column */}
          <div className="space-y-6">
            {/* Salary & Market Analysis */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">💰 Salary & Market Analysis</h4>

              {salary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Entry Level</div>
                      <div className="text-sm font-bold text-teal-400">{salary.entryLevel || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Mid Career</div>
                      <div className="text-sm font-bold text-cyan-400">{salary.midCareer || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Senior Level</div>
                      <div className="text-sm font-bold text-purple-400">{salary.seniorLevel || 'N/A'}</div>
                    </div>
                  </div>

                  {salary.globalComparison && (
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="text-sm font-semibold text-blue-300">Global Comparison</div>
                      <div className="text-sm text-white mt-1">{salary.globalComparison}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Salary information not available</div>
              )}

              {growth && (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-semibold text-white">Market Growth Analysis</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Nepal Market</div>
                      <div className={`text-sm font-bold ${growth.nepalMarket === 'Very High' ? 'text-green-400' : growth.nepalMarket === 'High' ? 'text-teal-400' : 'text-yellow-400'}`}>
                        {growth.nepalMarket || 'Medium'}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Automation Risk</div>
                      <div className={`text-sm font-bold ${growth.automationRisk === 'Low' ? 'text-green-400' : growth.automationRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {growth.automationRisk || 'Medium'}
                      </div>
                    </div>
                  </div>
                  {growth.futureOutlook && (
                    <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <div className="text-sm font-semibold text-emerald-300">Future Outlook</div>
                      <div className="text-sm text-white mt-1">{growth.futureOutlook}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Education Pathway */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">🎓 Education Pathway</h4>

              {education ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-400">Timeline</div>
                    <div className="text-sm font-semibold text-white mt-1">{education.timeline || 'Varies'}</div>
                  </div>

                  {education.pathway && (
                    <div>
                      <div className="text-sm text-slate-400">Step-by-Step Path</div>
                      <div className="text-sm text-white mt-1 whitespace-pre-line">{education.pathway}</div>
                    </div>
                  )}

                  {education.costEstimate && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="text-xs text-slate-400">In Nepal</div>
                        <div className="text-sm font-bold text-teal-400">{education.costEstimate.nepal || 'N/A'}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="text-xs text-slate-400">International</div>
                        <div className="text-sm font-bold text-cyan-400">{education.costEstimate.international || 'N/A'}</div>
                      </div>
                    </div>
                  )}

                  {education.nepalOptions && education.nepalOptions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-slate-400 mb-2">Nepal University Options</div>
                      <div className="flex flex-wrap gap-2">
                        {education.nepalOptions.map((opt: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs border border-teal-500/30">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Education information not available</div>
              )}

              {degrees && (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-semibold text-white">Degree Options</h5>
                  <div className="space-y-2">
                    {/* Add type check */}
                    {typeof degrees === 'object' && !Array.isArray(degrees) && degrees.essential && degrees.essential.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400">Essential Degrees</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {degrees.essential.map((d: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {typeof degrees === 'object' && !Array.isArray(degrees) && degrees.recommended && degrees.recommended.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400">Recommended</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {degrees.recommended.map((d: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Handle array case if needed */}
                    {Array.isArray(degrees) && degrees.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400">All Degrees</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {degrees.map((d: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skills & Development */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">🛠️ Skills & Development</h4>

              {skills ? (
                <div className="space-y-4">
                  {/* Check if skills is structured object */}
                  {typeof skills === 'object' && !Array.isArray(skills) ? (
                    <>
                      {skills.technical && skills.technical.length > 0 && (
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Technical Skills</div>
                          <div className="flex flex-wrap gap-2">
                            {skills.technical.map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs border border-teal-500/30">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {skills.soft && skills.soft.length > 0 && (
                        <div>
                          <div className="text-sm text-slate-400 mb-2">Soft Skills</div>
                          <div className="flex flex-wrap gap-2">
                            {skills.soft.map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs border border-cyan-500/30">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {skills.developmentPlan && (
                        <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                          <div className="text-sm font-semibold text-amber-300">Development Plan</div>
                          <div className="text-sm text-white mt-1 whitespace-pre-line">{skills.developmentPlan}</div>
                        </div>
                      )}
                    </>
                  ) : Array.isArray(skills) ? (
                    /* Handle simple array case */
                    <div>
                      <div className="text-sm text-slate-400 mb-2">All Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs border border-teal-500/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">Invalid skills format</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Skills information not available</div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Extracurricular & Certifications */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">📚 Extracurricular & Certifications</h4>

              {/* Extracurricular Section */}
              {extracurricular ? (
                <div className="space-y-4">
                  {/* Check if extracurricular is structured object */}
                  {typeof extracurricular === 'object' && !Array.isArray(extracurricular) ? (
                    <>
                      {extracurricular.schoolLevel && extracurricular.schoolLevel.length > 0 && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1">School Level Activities</div>
                          <div className="flex flex-wrap gap-2">
                            {extracurricular.schoolLevel.map((activity: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {extracurricular.undergraduate && extracurricular.undergraduate.length > 0 && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1 mt-3">Undergraduate Activities</div>
                          <div className="flex flex-wrap gap-2">
                            {extracurricular.undergraduate.map((activity: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : Array.isArray(extracurricular) ? (
                    /* Handle simple array case */
                    <div>
                      <div className="text-sm text-slate-400 mb-1">All Activities</div>
                      <div className="flex flex-wrap gap-2">
                        {extracurricular.map((activity: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">Invalid extracurricular format</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Extracurricular information not available</div>
              )}

              {/* Certifications Section */}
              {certifications ? (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-semibold text-white">Certifications</h5>
                  <div className="space-y-2">
                    {/* Check if certifications is structured object */}
                    {typeof certifications === 'object' && !Array.isArray(certifications) ? (
                      <>
                        {certifications.local && certifications.local.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-400">Local (Nepal)</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {certifications.local.map((cert: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {certifications.international && certifications.international.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-400">International</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {certifications.international.map((cert: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : Array.isArray(certifications) ? (
                      /* Handle simple array case */
                      <div>
                        <div className="text-xs text-slate-400">All Certifications</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {certifications.map((cert: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Invalid certifications format</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-400">Certifications information not available</div>
              )}
            </div>

            {/* Career Path & Job Titles */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">📈 Career Progression</h4>

              {jobTitles ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {/* First check if jobTitles is the structured object type */}
                    {typeof jobTitles === 'object' && !Array.isArray(jobTitles) ? (
                      <>
                        {/* Entry Level */}
                        {jobTitles.entry && jobTitles.entry.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-400">Entry Level Positions</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {jobTitles.entry.map((title: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                  {title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mid Career */}
                        {jobTitles.mid && jobTitles.mid.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-400 mt-3">Mid Career Positions</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {jobTitles.mid.map((title: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs">
                                  {title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Senior Positions */}
                        {jobTitles.senior && jobTitles.senior.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-400 mt-3">Senior Positions</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {jobTitles.senior.map((title: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                  {title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add entrepreneurial if needed */}
                        {jobTitles.entrepreneurial && jobTitles.entrepreneurial.length > 0 && (
                          <div>
                            <div className="text-sm text-slate-400 mt-3">Entrepreneurial Paths</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {jobTitles.entrepreneurial.map((title: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                                  {title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : Array.isArray(jobTitles) ? (
                      /* Handle simple array case */
                      <div>
                        <div className="text-sm text-slate-400">All Positions</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {jobTitles.map((title: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Invalid job titles format</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">Career progression information not available</div>
              )}
            </div>

            {/* Financial Planning */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-white mb-3">💰 Financial Planning</h4>

              <div className="space-y-4">
                {financialAdvice.educationCostAdvice && (
                  <div>
                    <div className="text-sm text-slate-400">Education Cost Advice</div>
                    <div className="text-sm text-white mt-1 whitespace-pre-line">{financialAdvice.educationCostAdvice}</div>
                  </div>
                )}

                {financialAdvice.budgetingTips && (
                  <div>
                    <div className="text-sm text-slate-400">Budgeting Tips</div>
                    <div className="mt-1 space-y-1">
                      {Array.isArray(financialAdvice.budgetingTips) ? (
                        financialAdvice.budgetingTips.map((tip: string, i: number) => (
                          <div key={i} className="text-sm text-white flex items-start gap-2">
                            <span className="text-teal-400 mt-1">•</span>
                            <span>{tip}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white whitespace-pre-line">{financialAdvice.budgetingTips}</div>
                      )}
                    </div>
                  </div>
                )}

                {financialAdvice.savingTips && (
                  <div>
                    <div className="text-sm text-slate-400">Saving Tips</div>
                    <div className="mt-1 space-y-1">
                      {Array.isArray(financialAdvice.savingTips) ? (
                        financialAdvice.savingTips.map((tip: string, i: number) => (
                          <div key={i} className="text-sm text-white flex items-start gap-2">
                            <span className="text-cyan-400 mt-1">•</span>
                            <span>{tip}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white whitespace-pre-line">{financialAdvice.savingTips}</div>
                      )}
                    </div>
                  </div>
                )}

                {financialAdvice.scholarshipSuggestions && (
                  <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="text-sm font-semibold text-green-300">Scholarship Suggestions</div>
                    <div className="text-sm text-white mt-1">
                      {typeof financialAdvice.scholarshipSuggestions === 'string'
                        ? financialAdvice.scholarshipSuggestions
                        : 'Various scholarship opportunities available'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Assessment & Success Metrics */}
            {(riskAssessment || successMetrics) && (
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
                <h4 className="text-lg font-semibold text-white mb-3">🎯 Risk & Success Planning</h4>

                <div className="space-y-4">
                  {riskAssessment && (
                    <div>
                      <div className="text-sm text-slate-400">Risk Assessment</div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Market Saturation:</span>
                          <span className="text-sm font-semibold text-white">{riskAssessment.marketSaturation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Barriers to Entry:</span>
                          <span className="text-sm font-semibold text-white">{riskAssessment.barriersToEntry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Adaptation Required:</span>
                          <span className="text-sm font-semibold text-white">{riskAssessment.adaptationRequired}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {successMetrics && (
                    <div>
                      <div className="text-sm text-slate-400">Success Metrics</div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Short Term (1-2 years):</span>
                          <span className="text-sm font-semibold text-teal-400">{successMetrics.shortTerm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Medium Term (3-5 years):</span>
                          <span className="text-sm font-semibold text-cyan-400">{successMetrics.mediumTerm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Long Term (10+ years):</span>
                          <span className="text-sm font-semibold text-purple-400">{successMetrics.longTerm}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nepal Opportunities & Remote Work */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {career.nepalOpportunities && (
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
                  <h5 className="text-sm font-semibold text-white mb-2">🇳🇵 Nepal Opportunities</h5>
                  <p className="text-sm text-slate-300">{career.nepalOpportunities}</p>
                </div>
              )}
              {career.remoteWork && (
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
                  <h5 className="text-sm font-semibold text-white mb-2">🌐 Remote Work</h5>
                  <p className="text-sm text-slate-300">{career.remoteWork}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-teal-500/30 bg-slate-800/50 backdrop-blur-sm">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                const q = `I need more detailed guidance for ${career.title}. Can you create a personalized 6-month plan?`;
                const ev = new CustomEvent('prefill-chat', { detail: q });
                window.dispatchEvent(ev);
                onClose();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
            >
              💬 Get Personalized Plan
            </Button>

            <Button
              onClick={() => {
                const q = `Tell me more about scholarships and financial aid for ${career.title}`;
                const ev = new CustomEvent('prefill-chat', { detail: q });
                window.dispatchEvent(ev);
                onClose();
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20"
            >
              💰 Scholarship Info
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Formatted Message Component --------------------
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: 'bullet' | 'number' | null = null;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className={`ml-4 space-y-1 my-2 ${listType === 'number' ? 'list-decimal' : 'list-disc'} list-inside`}>
          {currentList.map((item, i) => {
            const parts = item.split(/(\*\*.*?\*\*)/g);
            return (
              <li key={i} className="text-sm text-white leading-relaxed">
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                    const content = part.slice(2, -2);
                    return <strong key={j} className="font-semibold text-white">{content}</strong>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </li>
            );
          })}
        </ul>
      );
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('##')) {
      flushList();
      const heading = trimmed.replace(/^##\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <h3 key={`heading-${idx}`} className="font-bold text-white mt-4 mb-2 text-base">
          {heading}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.indexOf('**', 2) === trimmed.length - 2) {
      flushList();
      const heading = trimmed.slice(2, -2);
      elements.push(
        <h3 key={`heading-${idx}`} className="font-bold text-white mt-4 mb-2 text-base">
          {heading}
        </h3>
      );
      return;
    }

    if (trimmed.match(/^[-•]\s+/) || (trimmed.startsWith('* ') && !trimmed.match(/\*\*.*\*\*/))) {
      const content = trimmed.replace(/^[-•*]\s+/, '');
      currentList.push(content);
      if (listType === null) listType = 'bullet';
      return;
    }

    if (trimmed.match(/^\d+\.\s+/)) {
      const content = trimmed.replace(/^\d+\.\s+/, '');
      currentList.push(content);
      if (listType === null) listType = 'number';
      return;
    }

    flushList();
    if (trimmed.length > 0) {
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <p key={`p-${idx}`} className="text-sm text-white leading-relaxed my-2">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              const content = part.slice(2, -2);
              return <strong key={j} className="font-semibold text-white">{content}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    }
  });

  flushList();

  return <div className="formatted-message">{elements}</div>;
}

// -------------------- Modal Component --------------------
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-slate-800/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-teal-500/30 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-teal-500/30 bg-gradient-to-r from-teal-600/20 to-cyan-600/20">
          <h3 className="text-lg font-semibold text-white">{title || 'Details'}</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 px-3 py-1 rounded-lg transition-colors font-medium"
          >
            ✕ Close
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 scroll-smooth scrollbar-hide">{children}</div>
      </div>
    </div>
  );
}

// -------------------- Page + Sidebar --------------------
export default function UserPage() {
  const [loading, setLoading] = useState(true);
  const [careerSuggestions, setCareerSuggestions] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [fullQuizData, setFullQuizData] = useState<FullQuizData | undefined>(undefined);
  const [userInterestsText, setUserInterestsText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const router = useRouter();

  // Gamification state
  const [totalScore, setTotalScore] = useState(0);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Mentors state
  const [mentorsData, setMentorsData] = useState<any>(null);
  const [loadingMentors, setLoadingMentors] = useState(true);

  // Universities modal state
  const [uniModalOpen, setUniModalOpen] = useState(false);
  const [selectedCareerForUnis, setSelectedCareerForUnis] = useState<Career | null>(null);

  // Scholarship modal state
  const [scholarshipModalOpen, setScholarshipModalOpen] = useState(false);
  const [scholarshipData, setScholarshipData] = useState<any[]>([]);
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  // Saved careers state
  const [savedCareers, setSavedCareers] = useState<string[]>([]);

  // Career detail modal state
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [careerDetailOpen, setCareerDetailOpen] = useState(false);

  // Skill gap analysis state - store calculated levels to prevent re-rendering changes
  const [skillLevels, setSkillLevels] = useState<{ [key: string]: number }>({});

  // Info tooltip state
  const [showFitScoreInfo, setShowFitScoreInfo] = useState(false);
  const fitScoreInfoRef = useRef<HTMLDivElement | null>(null);

  // Close fit score info when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fitScoreInfoRef.current && !fitScoreInfoRef.current.contains(event.target as Node)) {
        setShowFitScoreInfo(false);
      }
    };

    if (showFitScoreInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFitScoreInfo]);

  // Calculate and cache skill levels to prevent re-rendering changes
  useEffect(() => {
    if (careerSuggestions[0]?.skills && fullQuizData?.skills) {
      const levels: { [key: string]: number } = {};

      // Extract skills list
      let skillsList: string[] = [];
      if (Array.isArray(careerSuggestions[0].skills)) {
        skillsList = careerSuggestions[0].skills;
      } else if (typeof careerSuggestions[0].skills === 'object' && careerSuggestions[0].skills.technical) {
        skillsList = [...(careerSuggestions[0].skills.technical || []), ...(careerSuggestions[0].skills.soft || [])];
      }

      // Calculate level for each skill (deterministic, not random)
      skillsList.slice(0, 6).forEach((skill) => {
        const userSkills = ((fullQuizData?.skills) || []).map((s: string) => s.toLowerCase());
        const skillExists = userSkills.includes((skill || '').toLowerCase());

        if (skillExists) {
          // If user has this skill, assign 75% (confident level)
          levels[skill] = 75;
        } else {
          // If user doesn't have this skill, assign 35% (needs development)
          levels[skill] = 35;
        }
      });

      setSkillLevels(levels);
    }
  }, [careerSuggestions, fullQuizData?.skills]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const userId = session.user.id;
        const userKey = (key: string) => `${key}_${userId}`;

        // Try to load quiz data from database first
        let quizDataLoaded = false;
        try {
          const response = await fetch('/api/quiz/get', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const { data: dbQuizData, careers: dbCareers } = await response.json();
            if (dbQuizData) {
              // Save to user-specific localStorage for offline access
              localStorage.setItem(userKey('fullQuizData'), JSON.stringify(dbQuizData));
              setFullQuizData(dbQuizData);
              setUserInterestsText(
                [dbQuizData.careerInterest, ...(dbQuizData.academicInterests || [])]
                  .filter(Boolean)
                  .join(', ')
              );
              quizDataLoaded = true;

              // Load career suggestions from database if available
              if (dbCareers && dbCareers.length > 0) {
                setCareerSuggestions(dbCareers);
                localStorage.setItem(userKey('careerSuggestions'), JSON.stringify(dbCareers));

                const scores = dbCareers.map((c: Career) => computeCareerScore(c, dbQuizData));
                const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
                setTotalScore(avg);
              }
            }
          }
        } catch (error) {
          console.error('Error loading quiz from database:', error);
        }

        // Fallback to user-specific localStorage if database load failed
        if (!quizDataLoaded) {
          const raw = localStorage.getItem(userKey('fullQuizData'));
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setFullQuizData(parsed);
              setUserInterestsText(
                [parsed.careerInterest, ...(parsed.academicInterests || [])]
                  .filter(Boolean)
                  .join(', ')
              );
            } catch (e) {
              console.warn('Invalid fullQuizData in localStorage');
            }
          }
        }

        setLoading(false);

        const quiz = fullQuizData || JSON.parse(localStorage.getItem(userKey('fullQuizData')) || 'null');

        // Only fetch career suggestions if not already loaded from database
        if (careerSuggestions.length === 0 && quiz && (quiz.grade || quiz.careerInterest)) {
          const cachedCareers = localStorage.getItem(userKey('careerSuggestions'));
          if (cachedCareers) {
            // Load from cache
            try {
              const careers = JSON.parse(cachedCareers);
              setCareerSuggestions(careers);

              // Calculate fit score from cached data
              const scores = careers.map((c: Career) => computeCareerScore(c, quiz));
              const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
              setTotalScore(avg);

              console.log('Loaded careers from cache');
            } catch (e) {
              console.warn('Invalid cached careers, fetching new ones');
              fetchCareerSuggestions(quiz);
            }
          } else {
            // No cache, fetch new suggestions
            fetchCareerSuggestions(quiz);
          }
        }

        // Load saved careers from database
        const { data: savedFromDb, error: savedError } = await supabase
          .from('saved_careers')
          .select('career_title')
          .eq('user_id', userId);

        if (!savedError && savedFromDb) {
          const savedTitles = savedFromDb.map(item => item.career_title);
          setSavedCareers(savedTitles);
          localStorage.setItem(userKey('savedCareers'), JSON.stringify(savedTitles));
        } else {
          // Fallback to localStorage if database fails
          const saved = localStorage.getItem(userKey('savedCareers'));
          if (saved) {
            try {
              setSavedCareers(JSON.parse(saved));
            } catch (e) {
              console.warn('Invalid savedCareers in localStorage');
            }
          }
        }
      } catch (err) {
        console.error('Auth or init error', err);
        setLoading(false);
        setErrorText('Initialization failed. Please reload.');
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // -------------------- Fetch active mentors --------------------
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch('/api/mentors/active');
        const data = await response.json();
        setMentorsData(data);
      } catch (error) {
        console.error('Failed to fetch mentors:', error);
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMentors, 30000);
    return () => clearInterval(interval);
  }, []);

  // -------------------- Prefill chat listener --------------------
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // CustomEvent with detail string expected
        // @ts-ignore
        const detail = (e as CustomEvent<string>).detail;
        if (typeof detail === 'string' && detail.trim()) {
          setChatInput(detail);
          setChatOpen(true);
          setChatMessages((m) => (m.length === 0 ? [{ from: 'ai', text: `Hi! I'm MentorAssist — I can help you with study plans, budgeting tips, and skill steps based on your profile.` }] : m));
          setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
        }
      } catch (err) {
        console.warn('prefill-chat handler error', err);
      }
    };

    window.addEventListener('prefill-chat', handler as EventListener);
    return () => window.removeEventListener('prefill-chat', handler as EventListener);
  }, []);

  // -------------------- Fetch careers --------------------
  const fetchCareerSuggestions = async (quizPayload: any) => {
    setLoadingCareers(true);
    setErrorText(null);
    try {
      const body = quizPayload?.grade ? quizPayload : fullQuizData || quizPayload;

      const res = await fetch('/api/career-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch careers');
      }

      const data = await res.json();

      // Show message if using fallback data due to rate limit
      if (data.fallback) {
        console.log('Using fallback career data due to API rate limit');
      }

      // Ensure we always have arrays and attach hardcoded unis if missing
      const careers: Career[] = (data.careers || []).map((c: Career) => ({
        ...c,
        universities: c.universities && c.universities.length > 0 ? c.universities : getUniversitiesForCareer(c.title),
      }));

      setCareerSuggestions(careers);

      // Save to database and user-specific localStorage
      const saveCareerData = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const userId = session.user.id;
            const userKey = (key: string) => `${key}_${userId}`;

            // Save to user-specific localStorage
            localStorage.setItem(userKey('careerSuggestions'), JSON.stringify(careers));

            // Save to database
            await fetch('/api/quiz/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                ...(fullQuizData || quizPayload),
                careerSuggestions: careers,
              }),
            });
          }
        } catch (error) {
          console.error('Error saving career data:', error);
        }
      };

      saveCareerData();

      // Compute aggregated gamified score
      const scores = careers.map((c) => computeCareerScore(c, fullQuizData || quizPayload));
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setTotalScore(avg);
    } catch (err: any) {
      console.error('Failed to fetch career suggestions:', err);
      setErrorText('Unable to generate career suggestions. Try again later.');
      // If API fails, show a helpful fallback
      setCareerSuggestions([
        {
          title: 'General Career',
          description: 'A stable and flexible career path.',
          salary: '$30k-$80k',
          growth: 'Medium',
          education: 'Varies',
          degrees: ['Any relevant degree'],
          skills: ['Communication', 'Problem-solving'],
          extracurricular: ['School clubs'],
          certifications: ['None'],
          jobTitles: ['Assistant', 'Coordinator'],
          universities: getUniversitiesForCareer('General Career'),
          financialAdvice: {
            budgetingTips: ['Create a simple monthly budget'],
            savingTips: ['Save a small part of your allowance'],
            educationCostAdvice: 'Look for affordable institutions and certificate programs.',
            scholarshipSuggestions: 'Search for local scholarships and grants.',
            earningWhileStudying: 'Try part-time tutoring or campus jobs.',
          },
        },
      ]);
      setTotalScore(50);
    } finally {
      setLoadingCareers(false);
    }
  };

  // -------------------- Chat send --------------------
  const openChatWithContext = () => {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        { from: 'ai', text: `Hi! I'm MentorAssist — I can help you with study plans, budgeting tips, and skill steps based on your profile.` },
      ]);
    }
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const closeChat = () => setChatOpen(false);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const message = chatInput.trim();
    setChatMessages((m) => [...m, { from: 'user', text: message }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const payload = {
        message,
        context: {
          profile: fullQuizData,
          careerSuggestions,
        },
      };

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // If non-200, try to parse JSON error safely
      if (!res.ok) {
        let errorMessage = "I couldn't reach the AI service. Try again later.";

        try {
          const errorData = await res.json();

          // Check for rate limit error
          if (res.status === 429 || errorData.error?.includes('rate_limit')) {
            errorMessage = "⏰ **API Rate Limit Reached**\n\nI've reached my daily token limit. The limit resets at midnight UTC.\n\n**What you can do:**\n- Try again in a few hours\n- Browse the career suggestions (they use fallback data)\n- Save careers for later review\n- Connect with active mentors for guidance\n\nSorry for the inconvenience!";
          } else if (res.status === 503 || errorData.error?.includes('not configured')) {
            errorMessage = "🔧 **AI Service Unavailable**\n\nThe AI assistant is currently not configured. Please contact support or try these alternatives:\n\n- Browse career suggestions below\n- Connect with active mentors\n- Save careers for later review\n\nWe apologize for the inconvenience!";
          } else if (errorData.error) {
            errorMessage = `⚠️ **Error**: ${errorData.error}`;
          }
        } catch (e) {
          // If parsing fails, use default message
          console.error('Error parsing error response:', e);
        }

        setChatMessages((m) => [...m, { from: 'ai', text: errorMessage }]);
        setChatLoading(false);
        return;
      }

      const json = await res.json();
      const reply = json.reply || "Sorry, I couldn't generate a response.";
      setChatMessages((m) => [...m, { from: 'ai', text: reply }]);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Chat error', err);
      setChatMessages((m) => [...m, { from: 'ai', text: "⚠️ **Connection Error**\n\nI couldn't reach the AI service. Please check your internet connection and try again.\n\nIf the problem persists, try:\n- Refreshing the page\n- Connecting with active mentors\n- Browsing career suggestions below" }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Fetch scholarship universities
  const fetchScholarshipUniversities = async () => {
    setScholarshipModalOpen(true);
    setLoadingScholarships(true);

    // Use curated fallback data immediately for reliability
    setTimeout(() => {
      setScholarshipData([
        {
          name: 'Kathmandu University',
          location: 'Nepal',
          scholarship: '75-100%',
          types: ['Merit-based', 'Need-based'],
          description: 'Offers generous scholarships for high-achieving students and those with financial need.',
          requirements: 'Strong academic record, entrance exam',
          programs: 'Engineering, Medicine, Business, Arts'
        },
        {
          name: 'Harvard University',
          location: 'USA',
          scholarship: '100%',
          types: ['Need-based'],
          description: 'Full financial aid for students from families earning less than $85,000/year.',
          requirements: 'Exceptional academics, SAT/ACT, essays',
          programs: 'All undergraduate programs'
        },
        {
          name: 'University of Toronto',
          location: 'Canada',
          scholarship: '70-100%',
          types: ['Merit-based', 'International scholarships'],
          description: 'Lester B. Pearson Scholarships cover full tuition and living expenses.',
          requirements: 'Academic excellence, leadership',
          programs: 'All programs'
        }
      ]);
      setLoadingScholarships(false);
    }, 800);
  };

  // Parse AI response to extract scholarship data
  const parseScholarshipData = (text: string) => {
    console.log('Parsing AI response:', text.substring(0, 200));

    // Method 1: Try to extract JSON array
    try {
      // Remove markdown code blocks if present
      let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('Successfully parsed JSON, found', parsed.length, 'universities');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse JSON from AI response:', e);
    }

    // Method 2: Try to parse structured text with numbered list
    const universities = [];

    // Split by numbers (1. 2. 3. etc)
    const sections = text.split(/(?:\n|^)\s*\d+\.\s+/).filter(s => s.trim().length > 20);

    console.log('Found', sections.length, 'text sections');

    for (const section of sections) {
      try {
        // More flexible parsing
        const lines = section.split('\n').map(l => l.trim()).filter(l => l);

        let name = '';
        let location = 'International';
        let scholarship = '70-100%';
        let types = ['Merit-based'];
        let description = 'Offers generous financial aid packages.';
        let requirements = 'Strong academic record';
        let programs = 'Various programs';

        // Extract first line as name if it doesn't have a label
        if (lines[0] && !lines[0].includes(':')) {
          name = lines[0].replace(/\*\*/g, '').trim();
        }

        // Parse labeled fields
        for (const line of lines) {
          const lower = line.toLowerCase();
          if (lower.includes('name:') || lower.includes('university:')) {
            name = line.split(':')[1]?.trim().replace(/\*\*/g, '') || name;
          } else if (lower.includes('location:') || lower.includes('country:')) {
            location = line.split(':')[1]?.trim() || location;
          } else if (lower.includes('scholarship:') || lower.includes('aid:')) {
            scholarship = line.split(':')[1]?.trim() || scholarship;
          } else if (lower.includes('type')) {
            const typeText = line.split(':')[1]?.trim() || '';
            types = typeText.split(',').map(t => t.trim()).filter(t => t);
            if (types.length === 0) types = ['Merit-based'];
          } else if (lower.includes('description:')) {
            description = line.split(':')[1]?.trim() || description;
          } else if (lower.includes('requirement')) {
            requirements = line.split(':')[1]?.trim() || requirements;
          } else if (lower.includes('program')) {
            programs = line.split(':')[1]?.trim() || programs;
          }
        }

        if (name && name.length > 3) {
          universities.push({ name, location, scholarship, types, description, requirements, programs });
        }
      } catch (e) {
        console.warn('Error parsing section:', e);
        continue;
      }
    }

    console.log('Parsed', universities.length, 'universities from text');

    // If we got some universities, return them
    if (universities.length >= 3) {
      return universities;
    }

    // Fallback: return structured data
    console.log('Using fallback data');
    return getFallbackScholarshipData();
  };

  // Fallback scholarship data
  const getFallbackScholarshipData = () => {
    return [
      {
        name: 'Kathmandu University',
        location: 'Nepal',
        scholarship: '75-100%',
        types: ['Merit-based', 'Need-based'],
        description: 'Offers generous scholarships for high-achieving students and those with financial need.',
        requirements: 'Strong academic record, entrance exam',
        programs: 'Engineering, Medicine, Business, Arts'
      },
      {
        name: 'Tribhuvan University',
        location: 'Nepal',
        scholarship: '70-90%',
        types: ['Merit-based', 'Government scholarships'],
        description: 'Nepal\'s largest university with various scholarship programs for deserving students.',
        requirements: 'Entrance exam, academic performance',
        programs: 'All major fields'
      },
      {
        name: 'Harvard University',
        location: 'USA',
        scholarship: '100%',
        types: ['Need-based'],
        description: 'Full financial aid for students from families earning less than $85,000/year.',
        requirements: 'Exceptional academics, SAT/ACT, essays',
        programs: 'All undergraduate programs'
      },
      {
        name: 'Stanford University',
        location: 'USA',
        scholarship: '100%',
        types: ['Need-based'],
        description: 'Covers full tuition for families earning less than $150,000/year.',
        requirements: 'Outstanding academics, standardized tests',
        programs: 'Engineering, Computer Science, Business'
      },
      {
        name: 'University of Toronto',
        location: 'Canada',
        scholarship: '70-100%',
        types: ['Merit-based', 'International scholarships'],
        description: 'Lester B. Pearson Scholarships cover full tuition and living expenses.',
        requirements: 'Academic excellence, leadership',
        programs: 'All programs'
      },
      {
        name: 'University of Melbourne',
        location: 'Australia',
        scholarship: '75-100%',
        types: ['Merit-based', 'International scholarships'],
        description: 'Melbourne International Undergraduate Scholarship for high achievers.',
        requirements: 'Strong academic record',
        programs: 'All undergraduate programs'
      },
      {
        name: 'University of Oxford',
        location: 'UK',
        scholarship: '100%',
        types: ['Need-based', 'Merit-based'],
        description: 'Reach Oxford Scholarships for students from low-income countries.',
        requirements: 'Academic excellence, financial need',
        programs: 'All undergraduate courses'
      },
      {
        name: 'MIT (Massachusetts Institute of Technology)',
        location: 'USA',
        scholarship: '100%',
        types: ['Need-based'],
        description: 'Meets full demonstrated financial need for all admitted students.',
        requirements: 'Exceptional STEM aptitude',
        programs: 'Engineering, Science, Technology'
      },
      {
        name: 'Asian Institute of Technology',
        location: 'Thailand',
        scholarship: '75-100%',
        types: ['Merit-based', 'Regional scholarships'],
        description: 'AIT Scholarships for Asian students in engineering and technology.',
        requirements: 'Good academic record',
        programs: 'Engineering, Technology, Management'
      },
      {
        name: 'National University of Singapore',
        location: 'Singapore',
        scholarship: '80-100%',
        types: ['Merit-based', 'ASEAN scholarships'],
        description: 'NUS Global Merit Scholarship for international students.',
        requirements: 'Outstanding academics',
        programs: 'All programs'
      }
    ];
  };

  // Save/Unsave career functions
  const toggleSaveCareer = async (careerTitle: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const userKey = (key: string) => `${key}_${userId}`;

    const isSaved = savedCareers.includes(careerTitle);

    if (isSaved) {
      // Unsave - remove from database
      const { error } = await supabase
        .from('saved_careers')
        .delete()
        .eq('user_id', userId)
        .eq('career_title', careerTitle);

      if (error) {
        console.error('Error removing saved career:', error);
        console.error('Error details:', error.message, error.details);
        return;
      }

      setSavedCareers((prev) => {
        const updated = prev.filter((title) => title !== careerTitle);
        localStorage.setItem(userKey('savedCareers'), JSON.stringify(updated));
        return updated;
      });
    } else {
      // Save - add to database with ALL career information
      const career = careerSuggestions.find(c => c.title === careerTitle);

      if (!career) {
        console.error('Career not found:', careerTitle);
        return;
      }

      // Log the career object to debug
      console.log('Saving career data:', {
        title: careerTitle,
        career: career,
        hasExtracurricular: 'extracurricular' in career,
        hasFinancialAdvice: 'financialAdvice' in career,
        allKeys: Object.keys(career)
      });

      // Extract salary range from the salary object
      const salaryRange = (() => {
        if (!career?.salary) return '';
        if (typeof career.salary === 'string') return career.salary;
        if (typeof career.salary === 'object') {
          if (career.salary.entryLevel && career.salary.midCareer) {
            return `${career.salary.entryLevel} → ${career.salary.midCareer}`;
          }
          if (career.salary.entryLevel) return career.salary.entryLevel;
          if (career.salary.midCareer) return career.salary.midCareer;
        }
        return '';
      })();

      // Extract growth potential from the growth object
      const growthPotential = (() => {
        if (!career?.growth) return '';
        if (typeof career.growth === 'string') return career.growth;
        if (typeof career.growth === 'object') {
          return career.growth.nepalMarket || career.growth.globalTrend || '';
        }
        return '';
      })();

      // Extract skills properly (handle both array and object formats)
      const skillsForSave = (() => {
        if (Array.isArray(career?.skills)) return career.skills;
        if (typeof career?.skills === 'object' && career.skills) {
          return [
            ...(Array.isArray(career.skills.technical) ? career.skills.technical : []),
            ...(Array.isArray(career.skills.soft) ? career.skills.soft : [])
          ];
        }
        return [];
      })();

      // Extract education as array of strings
      const educationForSave = (() => {
        if (Array.isArray(career?.education)) return career.education;
        if (typeof career?.education === 'object' && career.education) {
          return Array.isArray(career.education.degrees) ? career.education.degrees : [];
        }
        if (typeof career?.education === 'string') return [career.education];
        return [];
      })();

      // Extract certifications as array of strings
      const certificationsForSave = (() => {
        if (Array.isArray(career?.certifications)) return career.certifications;
        if (typeof career?.certifications === 'object' && career.certifications) {
          const certs = [];
          if (Array.isArray(career.certifications.local)) certs.push(...career.certifications.local);
          if (Array.isArray(career.certifications.online)) certs.push(...career.certifications.online);
          if (Array.isArray(career.certifications.international)) certs.push(...career.certifications.international);
          return certs;
        }
        return [];
      })();

      // Extract job titles as array of strings
      const jobTitlesForSave = (() => {
        if (Array.isArray(career?.jobTitles)) return career.jobTitles;
        if (typeof career?.jobTitles === 'object' && career.jobTitles) {
          return Object.values(career.jobTitles).filter(v => typeof v === 'string');
        }
        return [];
      })();

      // Extract universities as array of strings
      const universitiesForSave = (() => {
        if (Array.isArray(career?.universities)) {
          return career.universities.map(u => typeof u === 'string' ? u : u.name || '');
        }
        return [];
      })();

      // Extract extracurriculars as array of strings
      const extracurricularsForSave = (() => {
        if (Array.isArray(career?.extracurricular)) return career.extracurricular;
        if (typeof career?.extracurricular === 'object' && career.extracurricular) {
          const activities = [];
          if (Array.isArray(career.extracurricular.schoolLevel)) activities.push(...career.extracurricular.schoolLevel);
          if (Array.isArray(career.extracurricular.undergraduate)) activities.push(...career.extracurricular.undergraduate);
          return activities;
        }
        return [];
      })();

      // Extract financial guidance as array of strings
      const financialGuidanceForSave = (() => {
        if (Array.isArray(career?.financialAdvice)) return career.financialAdvice;
        if (typeof career?.financialAdvice === 'object' && career.financialAdvice) {
          const guidance = [];
          if (Array.isArray(career.financialAdvice.scholarships)) guidance.push(...career.financialAdvice.scholarships);
          if (Array.isArray(career.financialAdvice.loans)) guidance.push(...career.financialAdvice.loans);
          if (Array.isArray(career.financialAdvice.budgeting)) guidance.push(...career.financialAdvice.budgeting);
          return guidance;
        }
        return [];
      })();

      // Prepare the insert data
      const insertData = {
        user_id: userId,
        career_title: careerTitle,
        career_description: career?.description || '',
        education: typeof career?.education === 'string' ? career.education : '',
        field_of_study: career?.fieldOfStudy || '',
        top_skills: skillsForSave,
        certifications: certificationsForSave,
        possible_job_titles: jobTitlesForSave,
        universities: universitiesForSave,
        extracurriculars: extracurricularsForSave,
        financial_guidance: financialGuidanceForSave,
        career_path: career?.careerPath || '',
        salary_range: salaryRange,
        growth_potential: growthPotential,
        fit_score: career?.fitScore || 0
      };

      // Log the insert data for debugging
      console.log('Insert data prepared:', JSON.stringify(insertData, null, 2));

      const { data, error } = await supabase
        .from('saved_careers')
        .insert(insertData)
        .select(); // Add .select() to see what returns

      if (error) {
        console.error('Error saving career:', error);
        console.error('Full error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('Successfully saved career:', data);

      setSavedCareers((prev) => {
        const updated = [...prev, careerTitle];
        localStorage.setItem(userKey('savedCareers'), JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isCareerSaved = (careerTitle: string) => {
    return savedCareers.includes(careerTitle);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-teal-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500/20 border-t-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-slate-900 to-teal-900 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block bg-slate-800/90 backdrop-blur-sm border-r border-teal-500/20 min-h-screen pt-28 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">MentorLaunch</h2>
            <p className="text-sm text-slate-300 mt-2">Career guidance & study plans</p>

            {/* Active Mentors Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>👨‍🏫</span>
                Active Mentors
                {!loadingMentors && mentorsData?.active > 0 && (
                  <span className="ml-auto text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                    {mentorsData.active}
                  </span>
                )}
              </h3>

              {loadingMentors ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-200 border-t-indigo-600"></div>
                </div>
              ) : mentorsData?.mentors && mentorsData.mentors.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mentorsData.mentors.filter((m: any) => m.is_active).map((mentor: any) => (
                    <div key={mentor.id} className="p-3 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-teal-500/30 hover:border-teal-500/50 transition-all hover:shadow-lg hover:shadow-teal-500/10">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {mentor.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-white truncate">{mentor.name}</p>
                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse flex-shrink-0"></span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">{mentor.profession}</p>
                          <p className="text-xs text-teal-400">{mentor.experience}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;

                            // Create or get conversation
                            const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
                              p_user1_id: session.user.id,
                              p_user2_id: mentor.id,
                              p_user1_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                              p_user2_name: mentor.name
                            });

                            if (convError) {
                              console.error('Error creating conversation:', convError);
                              alert('Failed to start chat');
                              return;
                            }

                            // Send initial message
                            const { error: msgError } = await supabase
                              .from('messages')
                              .insert({
                                conversation_id: convId,
                                sender_id: session.user.id,
                                content: `Hi ${mentor.name}! I'd like to connect with you for career guidance.`
                              });

                            if (msgError) {
                              console.error('Error sending message:', msgError);
                            }

                            alert(`Chat started with ${mentor.name}! Check your messages.`);
                          } catch (error) {
                            console.error('Error starting chat:', error);
                            alert('Failed to start chat');
                          }
                        }}
                        className="w-full text-xs bg-teal-600 hover:bg-teal-700 text-white py-1.5 rounded-md transition-all font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
                      >
                        💬 Start Chat
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No mentors online</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <UserNavbar />

          <div className="pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">Your Career Dashboard</h1>
                  <p className="text-slate-300 text-lg">Deep insights, clear steps, and gamified goals to help you level up.</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Profile</p>
                    <p className="font-semibold text-white">{fullQuizData?.grade || 'Not set'} • {userInterestsText || 'No interests'}</p>
                  </div>

                  <Button
                    onClick={async () => {
                      // Clear all quiz data so user can retake it
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session) {
                        const userId = session.user.id;
                        const userKey = (key: string) => `${key}_${userId}`;

                        // Clear user-specific localStorage
                        localStorage.removeItem(userKey('careerSuggestions'));
                        localStorage.removeItem(userKey('fullQuizData'));
                        localStorage.removeItem(userKey('savedCareers'));

                        // Clear legacy keys (for backward compatibility)
                        localStorage.removeItem('careerSuggestions');
                        localStorage.removeItem('fullQuizData');
                        localStorage.removeItem('userGrade');
                        localStorage.removeItem('userInterests');
                      }
                      router.push('/welcome');
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
                    size="sm"
                  >
                    🔄 Retake Quiz
                  </Button>

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border-2 border-teal-500/30 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs w-100 text-slate-300 font-medium">Career Fit Score</div>
                      <button
                        onClick={() => setShowFitScoreInfo(!showFitScoreInfo)}
                        className="text-teal-400 hover:text-teal-300 transition-colors"
                        aria-label="Info about Career Fit Score"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-teal-400">{totalScore}<span className="text-lg text-slate-400">/100</span></div>

                    {showFitScoreInfo && (
                      <div
                        ref={fitScoreInfoRef}
                        className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-700/95 backdrop-blur-md rounded-xl shadow-2xl border border-teal-500/30 z-10"
                        style={{
                          animation: 'fadeIn 0.2s ease-out'
                        }}
                      >
                        <div className="flex z-100 items-start gap-2">
                          <span className="text-lg">📊</span>
                          <div>
                            <h4 className="font-semibold text-white mb-2">What is Career Fit Score?</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              Your Career Fit Score is a personalized metric that shows how well our suggested careers match your unique profile.
                              The score is calculated by analyzing your career interests, comparing your skills with job requirements, and evaluating your academic strengths.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="col-span-3 bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Top Recommendations</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                    {careerSuggestions.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex-shrink-0 w-80 p-4 rounded-xl border border-teal-500/30 bg-slate-700/50 backdrop-blur-sm snap-start hover:border-teal-500/50 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-teal-400">#{i + 1}</div>
                            <h4 className="text-xl font-semibold text-white mt-1">{c.title}</h4>
                            <p className="text-sm text-slate-300 mt-2 line-clamp-2">{c.description}</p>
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-xs text-slate-400">Growth</div>
                            <div className="font-bold text-sm text-teal-400">{getGrowthDisplay(c.growth)}</div>
                            <div className="text-xs text-slate-400 mt-2">Salary</div>
                            <div className="font-semibold text-sm text-cyan-400">{getSalaryDisplay(c.salary)}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {((c.skills && Array.isArray(c.skills) ? c.skills : [])).slice(0, 5).map((s, si) => (
                            <span key={si} className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs border border-teal-500/30">{s}</span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          <Button onClick={() => {
                            const ev = new CustomEvent('prefill-chat', { detail: `I want a 3-month plan to start: ${c.title}` });
                            window.dispatchEvent(ev);
                            setChatOpen(true);
                          }} size="sm" className="w-full text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20">📅 Get 3-month plan</Button>

                          <Button onClick={() => { setSelectedCareerForUnis(c); setUniModalOpen(true); }} size="sm" className="w-full text-xs bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20">🎓 Universities</Button>

                          <Button onClick={() => navigator.clipboard.writeText(c.title)} size="sm" variant="outline" className="w-full text-xs border-teal-500/30 text-teal-300 hover:bg-teal-500/10">📋 Copy</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Progress & Goals</h3>
                  <div className="mb-4">
                    <p className="text-sm text-slate-300">Overall Career Fit</p>
                    <div className="w-full bg-slate-700/50 rounded-full h-4 mt-2 overflow-hidden border border-teal-500/20">
                      <div className="h-4 rounded-full" style={{ width: `${totalScore}%`, background: 'linear-gradient(90deg, #14b8a6, #06b6d4)' }} />
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-400 mt-2">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-slate-300">Next Badge</h4>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg">Lv</div>
                      <div>
                        <div className="font-semibold text-white">Skill Builder</div>
                        <div className="text-xs text-slate-400">Complete 3 projects to unlock</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="col-span-2 space-y-6">
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Skill Gap Analysis</h3>

                    <p className="text-sm text-slate-300 mb-4">We compare your current skills with the top recommended career to show where to focus.</p>

                    {careerSuggestions[0] ? (
                      <div>
                        {(() => {
                          let skillsList: string[] = [];
                          if (careerSuggestions[0]?.skills) {
                            if (Array.isArray(careerSuggestions[0].skills)) {
                              skillsList = careerSuggestions[0].skills;
                            } else if (typeof careerSuggestions[0].skills === 'object' && careerSuggestions[0].skills.technical) {
                              skillsList = [...(careerSuggestions[0].skills.technical || []), ...(careerSuggestions[0].skills.soft || [])];
                            }
                          }
                          return skillsList.slice(0, 6).map((s: string, i: number) => {
                            // Use cached skill level from state instead of Math.random()
                            const level = skillLevels[s] ?? 50;
                            return (
                              <div key={i} className="mb-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-white">{s}</div>
                                  <div className="text-sm text-teal-400 font-semibold">{level}%</div>
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-3 mt-2 overflow-hidden border border-teal-500/20">
                                  <div className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${level}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}

                        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-teal-500/20">
                          <h4 className="text-sm font-semibold text-white mb-2">💡 Actionable Steps</h4>
                          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
                            <li>Pick 2 skills with lowest levels and schedule 30–60 minute daily practice sessions.</li>
                            <li>Complete 1 small project (2–4 weeks) demonstrating those skills.</li>
                            <li>Join a club or internship to build real-world experience.</li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">No primary recommendation yet. Generate suggestions to see skill gaps.</div>
                    )}
                  </div>

                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">5-Step Roadmap (Timeline)</h3>

                    <div className="space-y-6">
                      {['Months 0–3', 'Months 3–6', 'Months 6–12', 'Year 1–2', 'Year 3+'].map((label, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                          <div className="w-28 text-sm text-teal-400 font-semibold">{label}</div>
                          <div className="flex-1 bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30 hover:border-teal-500/50 transition-all">
                            <div className="flex items-between justify-between">
                              <div>
                                <div className="font-semibold text-white">{careerSuggestions[idx] ? `Step toward ${careerSuggestions[idx].title}` : 'General step'}</div>
                                <div className="text-sm text-slate-300">{careerSuggestions[idx]?.description || 'Build fundamentals and explore.'}</div>
                              </div>
                              <div className="text-sm text-slate-400">Effort: <span className="font-semibold text-cyan-400">{idx < 2 ? 'Low' : idx < 4 ? 'Medium' : 'High'}</span></div>
                            </div>

                            <div className="mt-3 text-sm text-slate-300">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Recommended focus: {(careerSuggestions[idx]?.skills && Array.isArray(careerSuggestions[idx]?.skills) ? careerSuggestions[idx]?.skills?.slice(0, 3).join(', ') : 'Study core subjects') || 'Study core subjects'}</li>
                                <li>Mini-goal: Complete one project or certification</li>
                                <li>Resources: Free online courses, local workshops</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Salary Breakdown</h3>
                    {careerSuggestions.length > 0 ? (
                      <div>
                        {careerSuggestions.slice(0, 4).map((c, i) => {
                          const range = getSalaryDisplay(c.salary);
                          return (
                            <div key={i} className="mb-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-white">{c.title}</div>
                                <div className="text-sm text-teal-400 font-semibold">{range}</div>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded-full h-3 mt-2 overflow-hidden border border-teal-500/20">
                                <div className={`h-3 rounded-full ${getGrowthDisplay(c.growth).includes('Very High') ? 'bg-gradient-to-r from-green-400 to-emerald-500' : getGrowthDisplay(c.growth).includes('High') ? 'bg-gradient-to-r from-teal-400 to-cyan-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`} style={{ width: `${40 + (i * 12)}%` }} />
                              </div>
                            </div>
                          );
                        })}

                        <div className="mt-4 text-sm text-slate-400 p-3 bg-slate-700/30 rounded-lg border border-teal-500/20">💡 Salaries are indicative and depend on region, experience, and employer.</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">No salary data available. Generate suggestions to view ranges.</div>
                    )}
                  </div>

                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Education Cost & ROI</h3>
                    <p className="text-sm text-slate-300 mb-3">Estimate costs and compare likely return on investment for top paths.</p>

                    {careerSuggestions[0] ? (
                      <>
                        <div className="mb-3 p-3 bg-slate-700/30 rounded-lg border border-teal-500/20">
                          <div className="text-sm font-medium text-white">Typical Education</div>
                          <div className="text-sm text-slate-300 mt-1">{getEducationDisplay(careerSuggestions[0].education)}</div>
                        </div>

                        <div className="mb-3 p-3 bg-slate-700/30 rounded-lg border border-teal-500/20">
                          <div className="text-sm font-medium text-white">Estimated Cost Range</div>
                          <div className="text-sm text-teal-400 font-semibold mt-1">{fullQuizData?.grade && fullQuizData.grade.toLowerCase().includes('high') ? '$5k - $20k (per year)' : '$2k - $12k (per year)'}</div>
                        </div>

                        <div>
                          <div className="text-sm font-medium">ROI Indicator</div>
                          <div className="mt-2 text-sm text-white-700">{getGrowthDisplay(careerSuggestions[0].growth).includes('Very High') ? 'High potential ROI' : getGrowthDisplay(careerSuggestions[0].growth).includes('High') ? 'Good ROI' : 'Moderate ROI'}</div>
                        </div>

                        <div className="mt-4">
                          <Button onClick={() => {
                            const q = `How can I finance a degree for ${careerSuggestions[0].title}? List scholarships, part-time ideas, and low-cost alternatives.`;
                            const ev = new CustomEvent('prefill-chat', { detail: q });
                            window.dispatchEvent(ev);
                            setChatOpen(true);
                          }}>Get financing ideas</Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500">No education cost data. Generate suggestions to see estimates.</div>
                    )}
                  </div>

                  <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-3">Quick Financial Tips</h3>
                    <ul className="text-sm space-y-2 text-slate-300">
                      <li>• Create a simple monthly budget and track small expenses.</li>
                      <li>• Save a set percentage of any income from part-time work or freelancing.</li>
                      <li>• Apply early for scholarships and local grants.</li>
                      <li>• Use free/low-cost online courses to build skills before investing in expensive degrees.</li>
                    </ul>
                  </div>

                  <div className=" rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <Button
                      onClick={fetchScholarshipUniversities}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all hover:scale-105"
                    >
                      💰 Get AI Financial & Scholarship Guidance
                    </Button>
                    <p className="text-xs text-center text-slate-400 mt-2">
                      Get personalized tips on universities with financial support & scholarships
                    </p>
                  </div>
                </div>
              </div>

              {/* Career deep-dive accordions */}
              <div className="mt-8 space-y-6">
                {careerSuggestions.map((career, idx) => (
                  <div key={idx} className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-teal-500/20 shadow-2xl hover:border-teal-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-teal-400 font-semibold bg-teal-500/20 px-2 py-1 rounded-full">#{idx + 1}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${computeCareerScore(career, fullQuizData) >= 80 ? 'bg-green-500/20 text-green-400' : computeCareerScore(career, fullQuizData) >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            Fit: {computeCareerScore(career, fullQuizData)}%
                          </span>
                          {typeof career.growth === 'object' && career.growth?.nepalMarket && (
                            <span className={`text-xs px-2 py-1 rounded-full ${career.growth.nepalMarket === 'High' || career.growth.nepalMarket === 'Very High' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                              {career.growth.nepalMarket} Growth
                            </span>
                          )}
                        </div>

                        <h4 className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{career.title}</h4>
                        <p className="text-sm text-slate-300 mt-1 line-clamp-2">{career.description}</p>

                        {/* Enhanced Information Grid */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Salary Information */}
                          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                            <div className="text-xs text-slate-400">Salary Range</div>
                            <div className="font-semibold text-teal-400 mt-1">
                              {getSalaryDisplay(career.salary)}
                            </div>
                            {typeof career.salary === 'object' && career.salary?.globalComparison && (
                              <div className="text-xs text-slate-400 mt-1">Global: {career.salary.globalComparison}</div>
                            )}
                          </div>

                          {/* Education Information */}
                          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                            <div className="text-xs text-slate-400">Education Path</div>
                            <div className="font-semibold text-white mt-1 truncate">
                              {getEducationDisplay(career.education)}
                            </div>
                            {typeof career.education === 'object' && career.education?.timeline && (
                              <div className="text-xs text-slate-400 mt-1">Timeline: {career.education.timeline}</div>
                            )}
                          </div>

                          {/* Extracurricular Preview */}
                          <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                            <div className="text-xs text-slate-400">Extracurricular</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(() => {
                                let activities: string[] = [];
                                if (career.extracurricular) {
                                  if (Array.isArray(career.extracurricular)) {
                                    activities = career.extracurricular.slice(0, 3);
                                  } else if (typeof career.extracurricular === 'object') {
                                    const schoolLevel = career.extracurricular?.schoolLevel || [];
                                    const undergraduate = career.extracurricular?.undergraduate || [];
                                    activities = [...schoolLevel, ...undergraduate].slice(0, 3);
                                  }
                                }
                                return activities.map((activity, i) => (
                                  <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                    {activity}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Risk Assessment */}
                          {career.riskAssessment && (
                            <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                              <div className="text-xs text-slate-400">Market Risk</div>
                              <div className="text-sm font-semibold text-white mt-1">
                                {career.riskAssessment.marketSaturation} • {career.riskAssessment.barriersToEntry}
                              </div>
                            </div>
                          )}

                          {/* Financial Tips */}
                          {career.financialAdvice?.educationCostAdvice && (
                            <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-teal-500/30">
                              <div className="text-xs text-slate-400">Financial Tip</div>
                              <div className="text-sm text-teal-300 mt-1 truncate">
                                {typeof career.financialAdvice.educationCostAdvice === 'string'
                                  ? career.financialAdvice.educationCostAdvice.substring(0, 60) + '...'
                                  : 'Plan finances early'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-56 text-right">
                        <div className="text-sm text-slate-400">Fit Score</div>
                        <div className="text-3xl font-bold text-teal-400">{computeCareerScore(career, fullQuizData)}</div>

                        {typeof career.growth === 'object' && (
                          <div className="mt-4">
                            <div className="text-sm text-slate-400">Automation Risk</div>
                            <div className={`text-sm font-semibold ${career.growth.automationRisk === 'Low' ? 'text-green-400' : career.growth.automationRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                              {career.growth.automationRisk || 'Medium'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30">
                        <div className="text-sm text-slate-400">Key Skills</div>
                        <div className="mt-2 text-sm text-slate-300">
                          {(() => {
                            let skillsDisplay = '—';

                            if (career.skills) {
                              if (typeof career.skills === 'object' && !Array.isArray(career.skills)) {
                                // Handle object format {technical, soft, developmentPlan}
                                const technical = Array.isArray(career.skills?.technical) ? career.skills.technical : [];
                                const soft = Array.isArray(career.skills?.soft) ? career.skills.soft : [];
                                const allSkills = [...technical, ...soft];

                                if (allSkills.length > 0) {
                                  skillsDisplay = allSkills.slice(0, 3).join(', ');
                                }
                              } else if (Array.isArray(career.skills)) {
                                // Handle array format
                                if (career.skills.length > 0) {
                                  skillsDisplay = career.skills.slice(0, 3).filter(Boolean).join(', ') || '—';
                                }
                              }
                            }

                            return skillsDisplay;
                          })()}
                        </div>
                      </div>

                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30">
                        <div className="text-sm text-slate-400">Certifications</div>
                        <div className="mt-2 text-sm text-slate-300">{formatList(career.certifications, 3)}</div>
                      </div>

                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30">
                        <div className="text-sm text-slate-400">Job Titles</div>
                        <div className="mt-2 text-sm text-slate-300">{formatList(career.jobTitles, 3)}</div>
                      </div>

                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-400">Universities</div>
                            <div className="mt-2 text-sm text-slate-300">{formatUniversities(career.universities, 3)}</div>
                          </div>
                          <div>
                            <button onClick={() => { setSelectedCareerForUnis(career); setUniModalOpen(true); }} className="margin-1 text-sm bg-teal-600 hover:bg-teal-700 p-1 rounded-lg w-14 text-white cursor-pointer transition-all shadow-lg shadow-teal-500/20">View</button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 border border-teal-500/30">
                        <div className="text-sm text-slate-400">Financial Guidance</div>
                        <div className="mt-2 text-sm text-slate-300">
                          {career.financialAdvice?.educationCostAdvice && typeof career.financialAdvice.educationCostAdvice === 'string'
                            ? career.financialAdvice.educationCostAdvice.substring(0, 80) + '...'
                            : 'See detailed financial advice'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        onClick={() => {
                          setSelectedCareer(career);
                          setCareerDetailOpen(true);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20"
                      >
                        📊 View All Details
                      </Button>

                      <Button onClick={() => {
                        const q = `Create a 6-month learning plan for ${career.title} with weekly milestones.`;
                        const ev = new CustomEvent('prefill-chat', { detail: q });
                        window.dispatchEvent(ev);
                        setChatOpen(true);
                      }} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20">
                        📅 Get Learning Plan
                      </Button>

                      <Button
                        onClick={() => toggleSaveCareer(career.title)}
                        className={isCareerSaved(career.title) ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20' : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/20'}
                      >
                        {isCareerSaved(career.title) ? '✓ Saved' : '⭐ Save'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {errorText && <p className="mt-6 text-sm text-red-600">{errorText}</p>}
            </div>
          </div>
        </main>
      </div>

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          aria-label="Open MentorAssist chat"
          onClick={() => { setChatOpen(true); openChatWithContext(); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-full px-5 py-3 shadow-2xl shadow-teal-500/30 transition-all hover:scale-105"
        >
          <span className="text-lg font-bold">💬 MentorAssist</span>
          <span className="text-xs bg-white text-teal-600 px-2 py-1 rounded-full font-semibold">AI</span>
        </button>
      )}

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[500px] bg-slate-800/95 backdrop-blur-md shadow-2xl border-l border-teal-500/30 flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-lg">
                  🤖
                </div>
                <div>
                  <h4 className="text-lg font-bold">MentorAssist</h4>
                  <p className="text-xs text-teal-100">Your AI Career Guide</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setChatMessages([]);
                    setChatInput('');
                  }}
                  title="Clear chat"
                  className="text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 text-sm transition-colors"
                >
                  🗑️
                </button>
                <button
                  onClick={closeChat}
                  className="text-white/80 hover:text-white px-3 py-1 rounded hover:bg-white/10 font-semibold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="text-xs text-white-700">
              Ask about careers, scholarships, study plans, and more
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 scroll-smooth scrollbar-hide">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💡</div>
                <p className="text-sm text-white-700 mb-4">Start a conversation with MentorAssist</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setChatInput('What are the best scholarships for international students?');
                    }}
                    className="w-full text-left px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-teal-500/30 hover:border-teal-500/50 text-sm text-slate-300 hover:bg-teal-500/10 transition-all"
                  >
                    💰 Best scholarships for international students
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('Create a 3-month study plan for me');
                    }}
                    className="w-full text-left px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-teal-500/30 hover:border-teal-500/50 text-sm text-slate-300 hover:bg-teal-500/10 transition-all"
                  >
                    📚 Create a 3-month study plan
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('How can I improve my application for top universities?');
                    }}
                    className="w-full text-left px-4 py-2 bg-slate-700/50 backdrop-blur-sm rounded-lg border border-teal-500/30 hover:border-teal-500/50 text-sm text-slate-300 hover:bg-teal-500/10 transition-all"
                  >
                    🎓 Tips for university applications
                  </button>
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${m.from === 'ai' ? 'bg-slate-700/50 backdrop-blur-sm border border-teal-500/30' : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'} rounded-2xl p-4 shadow-lg`}>
                  {m.from === 'ai' ? (
                    <FormattedMessage text={m.text} />
                  ) : (
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 backdrop-blur-sm border border-teal-500/30 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-slate-300">MentorAssist is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-800/95 backdrop-blur-md border-t border-teal-500/30">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Ask anything about your career..."
                className="flex-1 rounded-xl border-2 border-teal-500/30 bg-slate-700/50 backdrop-blur-sm px-4 py-3 focus:outline-none focus:border-teal-500 text-sm text-white placeholder-slate-400"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-700 hover:to-cyan-700 transition-all font-semibold text-sm shadow-lg shadow-teal-500/20"
              >
                {chatLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Career Detail Modal */}
      {selectedCareer && (
        <CareerDetailModal
          career={selectedCareer}
          open={careerDetailOpen}
          onClose={() => {
            setCareerDetailOpen(false);
            setSelectedCareer(null);
          }}
        />
      )}

      {/* Universities Modal */}
      <Modal
        open={uniModalOpen}
        onClose={() => { setUniModalOpen(false); setSelectedCareerForUnis(null); }}
        title={selectedCareerForUnis ? `Recommended Universities for ${selectedCareerForUnis.title}` : 'Recommended Universities'}
      >
        {selectedCareerForUnis ? (
          <>
            <p className="text-sm text-slate-300 mb-3">Suggested universities (by affordability / fit). Click any to ask MentorAssist for more details.</p>
            <div className="space-y-3">
              {(selectedCareerForUnis.universities || getUniversitiesForCareer(selectedCareerForUnis.title)).map((u, i) => {
                // Handle both string and object formats
                const uniName = typeof u === 'string' ? u : (u?.name || 'University');
                const uniLocation = typeof u === 'object' ? u?.location : '';
                const uniProgram = typeof u === 'object' ? u?.program : '';

                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-teal-500/30 bg-slate-700/50 backdrop-blur-sm hover:border-teal-500/50 transition-all">
                    <div>
                      <div className="font-medium text-white">{uniName}</div>
                      {uniLocation && <div className="text-xs text-slate-400 mt-0.5">📍 {uniLocation}</div>}
                      {uniProgram && <div className="text-xs text-teal-400 mt-1">Program: {uniProgram}</div>}
                      {!uniLocation && <div className="text-xs text-teal-400 mt-1">{i === 0 ? '⭐ Top suggestion' : '✓ Recommended'}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const q = `Tell me about ${uniName}: tuition range, admission overview, scholarship opportunities, and why it's a good fit for ${selectedCareerForUnis.title}.`;
                          const ev = new CustomEvent('prefill-chat', { detail: q });
                          window.dispatchEvent(ev);
                          setUniModalOpen(false);
                          setChatOpen(true);
                        }}
                        className="px-3 py-1 rounded-md border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-sm transition-all"
                      >
                        Ask
                      </button>

                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(uniName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-md border border-teal-500/30 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm transition-all shadow-lg shadow-teal-500/20"
                      >
                        Visit
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-400">No universities available.</div>
        )}
      </Modal>

      {/* Scholarship Universities Modal */}
      <Modal
        open={scholarshipModalOpen}
        onClose={() => { setScholarshipModalOpen(false); setScholarshipData([]); }}
        title="🎓 Universities with 70%+ Scholarship Opportunities"
      >
        {loadingScholarships ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600 mb-4" />
            <p className="text-sm text-slate-300">Generating AI-powered scholarship recommendations...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-teal-500/10 rounded-lg border border-teal-500/30 backdrop-blur-sm">
              <p className="text-sm text-teal-300">
                <strong>💡 Pro Tip:</strong> These universities offer substantial financial aid (70-100% scholarships).
                Start your applications early and prepare strong essays highlighting your achievements and financial need.
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {scholarshipData.map((uni, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-teal-500/30 bg-slate-700/50 backdrop-blur-sm hover:border-teal-500/50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{uni.name}</h4>
                      <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                        <span>📍 {uni.location}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-bold">
                        {uni.scholarship}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Scholarship Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(uni.types || []).map((type: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Description:</span>
                      <p className="text-sm text-slate-300 mt-1">{uni.description}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Requirements:</span>
                      <p className="text-sm text-slate-300 mt-1">{uni.requirements}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase">Programs:</span>
                      <p className="text-sm text-slate-300 mt-1">{uni.programs}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-600/50">
                    <button
                      onClick={() => {
                        const q = `Tell me more about ${uni.name}: detailed scholarship application process, deadlines, success tips, and how to maximize my chances of getting ${uni.scholarship} scholarship.`;
                        const ev = new CustomEvent('prefill-chat', { detail: q });
                        window.dispatchEvent(ev);
                        setScholarshipModalOpen(false);
                        setChatOpen(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-sm font-medium transition-colors"
                    >
                      💬 Ask AI
                    </button>

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(uni.name + ' scholarships')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium text-center transition-colors shadow-lg shadow-green-500/20"
                    >
                      🔍 Search
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 backdrop-blur-sm">
              <p className="text-xs text-cyan-300">
                <strong>📚 Additional Resources:</strong> Visit scholarship databases like
                <a href="https://www.scholarships.com" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-cyan-200">Scholarships.com</a>,
                <a href="https://www.fastweb.com" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-cyan-200">Fastweb</a>, and
                <a href="https://www.internationalscholarships.com" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-cyan-200">InternationalScholarships.com</a>
              </p>
            </div>
          </>
        )}
      </Modal>

      {/* Chat */}
      <Chat />

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
