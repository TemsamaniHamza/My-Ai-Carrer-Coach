'use client';

import { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { EducationItem, ExperienceItem, UserProfile } from '@/types/user';
import { TagListEditor } from './TagListEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

interface ProfileFormProps {
  user: UserProfile;
  onNavigate: (tab: Tab) => void;
}

export function ProfileForm({ user, onNavigate }: ProfileFormProps) {
  const { updateProfile } = useAuth();

  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title ?? '');
  const [summary, setSummary] = useState(user.summary ?? '');
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [languages, setLanguages] = useState<string[]>(user.languages);
  const [experience, setExperience] = useState<ExperienceItem[]>(user.experience);
  const [education, setEducation] = useState<EducationItem[]>(user.education);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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
      setSuccessMessage('Profile saved.');
      // Brief pause so the confirmation is actually visible before leaving
      // the page, rather than an instant jump that hides it entirely.
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Backend Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="mb-1 block text-sm font-medium text-gray-700">
          Summary
        </label>
        <textarea
          id="summary"
          rows={3}
          placeholder="A short professional summary."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
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

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
