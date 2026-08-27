'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileText, Mail, Mic, User } from 'lucide-react';
import { api } from '@/lib/api';
import { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

interface HomeTabProps {
  user: UserProfile;
  onNavigate: (tab: Tab) => void;
}

interface FeatureCard {
  tab: Tab;
  icon: typeof User;
  title: string;
  description: string;
  cta: string;
}

const FEATURES: FeatureCard[] = [
  {
    tab: 'profile',
    icon: User,
    title: 'Profile',
    description: 'Your skills, experience, and education — the data source everything else builds on.',
    cta: 'Edit profile',
  },
  {
    tab: 'resume',
    icon: FileText,
    title: 'Resume',
    description: 'Generate a polished, ATS-friendly resume from your profile in one click.',
    cta: 'Generate a resume',
  },
  {
    tab: 'cover-letter',
    icon: Mail,
    title: 'Cover Letter',
    description: 'Paste a job description and get a cover letter tailored to it.',
    cta: 'Write a cover letter',
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
        <h2 className="text-xl font-semibold text-foreground">
          Welcome to AI Career Coach, {user.name.split(' ')[0]}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Build your profile once, then let AI turn it into a resume, a tailored cover letter, and
          practice interview sessions — all from the same source of truth.
        </p>
      </div>

      {completeness < 100 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-amber-800">
                Your profile is <span className="font-semibold">{completeness}%</span> complete —
                the more you fill in, the better your generated resume and cover letters will be.
              </p>
              <Button
                size="sm"
                onClick={() => onNavigate('profile')}
                className="shrink-0 whitespace-nowrap bg-amber-800 text-white hover:bg-amber-900"
              >
                Complete it
              </Button>
            </div>
            <Progress value={completeness} className="mt-3 h-1.5 bg-amber-200 [&>div]:bg-amber-800" />
          </CardContent>
        </Card>
      )}

      {/* Interview Prep is the flagship feature — a hero card, not just
          another grid tile, so it's the first thing that pulls the eye. */}
      <button
        onClick={() => onNavigate('interview')}
        className="group relative mb-6 flex w-full flex-col items-start overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-indigo-600 p-6 text-left shadow-md transition hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition group-hover:scale-125"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
            <Mic className="h-6 w-6" />
          </span>
          <div>
            <span className="mb-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Flagship feature
            </span>
            <h3 className="text-lg font-semibold text-white">Interview Prep</h3>
            <p className="mt-1 max-w-md text-sm text-white/85">
              Practice a live mock interview with real-time AI feedback and scoring on every
              answer — the fastest way to walk in ready.
            </p>
          </div>
        </div>
        <span className="relative mt-4 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition group-hover:gap-2.5 sm:mt-0">
          Start practicing
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.tab}
              onClick={() => onNavigate(feature.tab)}
              className="group flex flex-col items-start rounded-lg border p-5 text-left transition hover:border-primary hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-3 font-semibold text-foreground">{feature.title}</span>
              <span className="mt-1 text-sm text-muted-foreground">{feature.description}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                {feature.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      {user.strengthsWeaknesses &&
        (user.strengthsWeaknesses.strengths.length > 0 ||
          user.strengthsWeaknesses.weaknesses.length > 0) && (
          <div className="mt-8 border-t pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Strengths &amp; Weaknesses</h3>
              <button
                onClick={() => onNavigate('interview')}
                className="text-xs font-medium text-primary hover:underline"
              >
                Practice more →
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
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
        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{counts.resumes}</p>
            <p className="text-xs text-muted-foreground">Resumes generated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{counts.coverLetters}</p>
            <p className="text-xs text-muted-foreground">Cover letters written</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-foreground">{counts.interviews}</p>
            <p className="text-xs text-muted-foreground">Interviews practiced</p>
          </div>
        </div>
      )}
    </div>
  );
}
