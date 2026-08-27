'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HomeTab } from '@/components/home/HomeTab';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ResumePanel } from '@/components/ai/ResumePanel';
import { CoverLetterPanel } from '@/components/ai/CoverLetterPanel';
import { InterviewChat } from '@/components/interview/InterviewChat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'resume', label: 'Resume' },
  { id: 'cover-letter', label: 'Cover Letter' },
  { id: 'interview', label: 'Interview Prep' },
];

const ACTIVE_TAB_STORAGE_KEY = 'dashboard-active-tab';

function readStoredTab(): Tab {
  if (typeof window === 'undefined') return 'home';
  const stored = sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return TABS.some((t) => t.id === stored) ? (stored as Tab) : 'home';
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  // Without this, a reload always dumped the user back on the first tab —
  // easy to misread as "my resume/cover letter is gone" when it was really
  // just no longer the tab in view. Persisted in sessionStorage (not React
  // state alone) so it survives the full page reload.
  const [activeTab, setActiveTabState] = useState<Tab>(readStoredTab);

  function setActiveTab(tab: Tab) {
    setActiveTabState(tab);
    sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  }

  // While Profile is active and dirty, ProfileForm registers a guard here so
  // clicks on the tab bar go through its own unsaved-changes confirmation
  // instead of switching tabs (and silently discarding edits) immediately.
  const profileLeaveGuard = useRef<((tab: Tab) => void) | null>(null);

  function requestTabChange(tab: Tab) {
    if (activeTab === 'profile' && profileLeaveGuard.current) {
      profileLeaveGuard.current(tab);
      return;
    }
    setActiveTab(tab);
  }

  // isLoading is true only during the initial silent-refresh check on app
  // load; once it settles, no user means there's no valid session at all.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const userInitial = user.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* print:hidden — none of the app chrome (welcome banner, tabs) belongs
            in the PDF a user downloads from the Resume tab. */}
        <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-primary/10 text-primary">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
                Welcome, {user.name}
                <Sparkles className="h-4 w-4 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut />
            Log out
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => requestTabChange(value as Tab)}
          className="print:hidden"
        >
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {activeTab === 'home' && <HomeTab user={user} onNavigate={setActiveTab} />}
          {activeTab === 'profile' && (
            <ProfileForm
              user={user}
              onNavigate={setActiveTab}
              registerLeaveGuard={(guard) => {
                profileLeaveGuard.current = guard;
              }}
            />
          )}
          {activeTab === 'resume' && <ResumePanel user={user} />}
          {activeTab === 'cover-letter' && <CoverLetterPanel />}
          {activeTab === 'interview' && <InterviewChat onNavigate={setActiveTab} />}
        </div>
      </div>
    </main>
  );
}
