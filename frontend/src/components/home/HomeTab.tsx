'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserProfile } from '@/types/user';

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

interface HomeTabProps {
  user: UserProfile;
  onNavigate: (tab: Tab) => void;
}

interface FeatureCard {
  tab: Tab;
  icon: string;
  title: string;
  description: string;
  cta: string;
}

const FEATURES: FeatureCard[] = [
  {
    tab: 'profile',
    icon: '👤',
    title: 'Profile',
    description: 'Your skills, experience, and education — the data source everything else builds on.',
    cta: 'Edit profile',
  },
  {
    tab: 'resume',
    icon: '📄',
    title: 'Resume',
    description: 'Generate a polished, ATS-friendly resume from your profile in one click.',
    cta: 'Generate a resume',
  },
  {
    tab: 'cover-letter',
    icon: '✉️',
    title: 'Cover Letter',
    description: 'Paste a job description and get a cover letter tailored to it.',
    cta: 'Write a cover letter',
  },
  {
    tab: 'interview',
    icon: '🎤',
    title: 'Interview Prep',
    description: 'Practice a 5-question mock interview with real-time AI feedback on each answer.',
    cta: 'Start practicing',
  },
];

function computeProfileCompleteness(user: UserProfile): number {
  const checks = [
    Boolean(user.title),
    Boolean(user.summary),
    user.skills.length > 0,
    user.experience.length > 0,
    user.education.length > 0,
    user.languages.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function HomeTab({ user, onNavigate }: HomeTabProps) {
  const [counts, setCounts] = useState<{ resumes: number; coverLetters: number; interviews: number } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      api.get<unknown[]>('/ai/resumes'),
      api.get<unknown[]>('/ai/cover-letters'),
      api.get<unknown[]>('/ai/interview/sessions'),
    ])
      .then(([resumes, coverLetters, interviews]) => {
        setCounts({
          resumes: resumes.data.length,
          coverLetters: coverLetters.data.length,
          interviews: interviews.data.length,
        });
      })
      .catch(() => {
        /* stats are a nice-to-have — a failed load just leaves the cards hidden */
      });
  }, []);

  const completeness = computeProfileCompleteness(user);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome to AI Career Coach, {user.name.split(' ')[0]}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Build your profile once, then let AI turn it into a resume, a tailored cover letter, and
          practice interview sessions — all from the same source of truth.
        </p>
      </div>

      {completeness < 100 && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-800">
              Your profile is <span className="font-semibold">{completeness}%</span> complete —
              the more you fill in, the better your generated resume and cover letters will be.
            </p>
            <button
              onClick={() => onNavigate('profile')}
              className="whitespace-nowrap rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
            >
              Complete it
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-800 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <button
            key={feature.tab}
            onClick={() => onNavigate(feature.tab)}
            className="group flex flex-col items-start rounded-lg border border-gray-200 p-5 text-left transition hover:border-blue-600 hover:shadow-sm"
          >
            <span className="text-2xl">{feature.icon}</span>
            <span className="mt-3 font-semibold text-gray-900">{feature.title}</span>
            <span className="mt-1 text-sm text-gray-500">{feature.description}</span>
            <span className="mt-3 text-sm font-medium text-blue-700 group-hover:underline">
              {feature.cta} →
            </span>
          </button>
        ))}
      </div>

      {user.strengthsWeaknesses &&
        (user.strengthsWeaknesses.strengths.length > 0 ||
          user.strengthsWeaknesses.weaknesses.length > 0) && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Strengths &amp; Weaknesses</h3>
              <button
                onClick={() => onNavigate('interview')}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                Practice more →
              </button>
            </div>
            <p className="mb-3 text-xs text-gray-400">
              Based on your interview practice so far — updates after each completed interview.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-green-700">Strengths</p>
                {user.strengthsWeaknesses.strengths.length > 0 ? (
                  <ul className="space-y-1 text-sm text-green-900">
                    {user.strengthsWeaknesses.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-800">None identified yet</p>
                )}
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase text-amber-700">
                  Areas to improve
                </p>
                {user.strengthsWeaknesses.weaknesses.length > 0 ? (
                  <ul className="space-y-1 text-sm text-amber-900">
                    {user.strengthsWeaknesses.weaknesses.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-800">None identified yet</p>
                )}
              </div>
            </div>
          </div>
        )}

      {counts && (counts.resumes > 0 || counts.coverLetters > 0 || counts.interviews > 0) && (
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{counts.resumes}</p>
            <p className="text-xs text-gray-500">Resumes generated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{counts.coverLetters}</p>
            <p className="text-xs text-gray-500">Cover letters written</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{counts.interviews}</p>
            <p className="text-xs text-gray-500">Interviews practiced</p>
          </div>
        </div>
      )}
    </div>
  );
}
