'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HomeTab } from '@/components/home/HomeTab';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ResumePanel } from '@/components/ai/ResumePanel';
import { CoverLetterPanel } from '@/components/ai/CoverLetterPanel';
import { InterviewChat } from '@/components/interview/InterviewChat';

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

  // isLoading is true only during the initial silent-refresh check on app
  // load; once it settles, no user means there's no valid session at all.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* print:hidden — none of the app chrome (welcome banner, tabs) belongs
            in the PDF a user downloads from the Resume tab. */}
        <div className="mb-8 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>

        <div className="mb-6 flex gap-1 border-b border-gray-200 print:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none">
          {activeTab === 'home' && <HomeTab user={user} onNavigate={setActiveTab} />}
          {activeTab === 'profile' && <ProfileForm user={user} onNavigate={setActiveTab} />}
          {activeTab === 'resume' && <ResumePanel />}
          {activeTab === 'cover-letter' && <CoverLetterPanel />}
          {activeTab === 'interview' && <InterviewChat onNavigate={setActiveTab} />}
        </div>
      </div>
    </main>
  );
}
