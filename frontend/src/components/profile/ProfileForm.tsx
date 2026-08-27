'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { EducationItem, ExperienceItem, UserProfile } from '@/types/user';
import { TagListEditor } from './TagListEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

interface ProfileFormProps {
  user: UserProfile;
  onNavigate: (tab: Tab) => void;
  // Lets the dashboard's own tab bar (which navigates independently of this
  // form) check for unsaved changes before switching away from Profile —
  // called with the guard function itself each render so the parent always
  // has one bound to current isDirty, and cleared on unmount.
  registerLeaveGuard?: (guard: ((tab: Tab) => void) | null) => void;
}

export function ProfileForm({ user, onNavigate, registerLeaveGuard }: ProfileFormProps) {
  const { updateProfile } = useAuth();

  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title ?? '');
  const [summary, setSummary] = useState(user.summary ?? '');
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [languages, setLanguages] = useState<string[]>(user.languages);
  const [experience, setExperience] = useState<ExperienceItem[]>(user.experience);
  const [education, setEducation] = useState<EducationItem[]>(user.education);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<Tab | null>(null);

  // Snapshot of the last-saved shape, compared against current field state to
  // decide whether there's anything a navigation away would actually lose.
  const savedSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: user.name,
        title: user.title ?? '',
        summary: user.summary ?? '',
        skills: user.skills,
        languages: user.languages,
        experience: user.experience,
        education: user.education,
      }),
    [user],
  );
  const isDirty =
    JSON.stringify({ name, title, summary, skills, languages, experience, education }) !==
    savedSnapshot;

  // Closing the tab or reloading mid-edit loses everything below — warn
  // before that happens. Browsers ignore any custom message text and show
  // their own generic wording, but the required preventDefault + returnValue
  // pair is still what triggers that native prompt at all.
  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function handleNavigateAway(tab: Tab) {
    if (isDirty) {
      setPendingNavigation(tab);
      return;
    }
    onNavigate(tab);
  }

  function confirmDiscardAndLeave() {
    if (pendingNavigation) onNavigate(pendingNavigation);
    setPendingNavigation(null);
  }

  // Re-registers on every render (deliberately not memoized) so the guard
  // the dashboard holds always closes over the current isDirty — otherwise
  // a stale guard from an earlier render could wave through a real
  // unsaved-changes case.
  useEffect(() => {
    registerLeaveGuard?.(handleNavigateAway);
    return () => registerLeaveGuard?.(null);
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      // Trim blank experience/education entries the user added but never
      // filled in — the backend DTO would otherwise reject them as invalid
      // (required fields empty).
      const cleanExperience = experience.filter((item) => item.company && item.role && item.duration);
      const cleanEducation = education.filter((item) => item.institution && item.degree && item.duration);

      await updateProfile({
        name,
        title,
        summary,
        skills,
        languages,
        experience: cleanExperience,
        education: cleanEducation,
      });
      toast.success('Profile saved.');
      // Brief pause so the confirmation toast is visible before leaving the
      // page, rather than an instant jump that hides it entirely.
      setTimeout(() => onNavigate('home'), 900);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const message = axiosErr.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message ?? 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {isDirty && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You have unsaved changes — they&apos;ll be lost if you leave without saving.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Backend Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            rows={3}
            placeholder="A short professional summary."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <TagListEditor
          label="Skills"
          placeholder="e.g. TypeScript"
          items={skills}
          onChange={setSkills}
        />

        <TagListEditor
          label="Languages"
          placeholder="e.g. English"
          items={languages}
          onChange={setLanguages}
        />

        <ExperienceEditor items={experience} onChange={setExperience} />

        <EducationEditor items={education} onChange={setEducation} />

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </Button>
          {isDirty && !isSaving && (
            <Button type="button" variant="ghost" onClick={() => handleNavigateAway('home')}>
              Discard changes
            </Button>
          )}
        </div>
      </form>

      <AlertDialog
        open={pendingNavigation !== null}
        onOpenChange={(open) => !open && setPendingNavigation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved profile changes. Leaving this tab now will discard them — this
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardAndLeave}>
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
