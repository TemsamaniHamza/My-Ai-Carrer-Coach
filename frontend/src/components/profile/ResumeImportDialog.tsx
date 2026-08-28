'use client';

import { useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ExtractedProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type FieldKey = keyof ExtractedProfile;

interface ResumeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Applies only the fields the user left checked, merging into the form's
  // current (unsaved) state — never calls the save API itself, so this
  // never overwrites anything until the user explicitly clicks Save profile.
  onApply: (fields: Partial<ExtractedProfile>) => void;
}

/**
 * Upload → extract → review flow. The review step exists specifically so
 * a resume upload can never silently clobber a profile someone already
 * filled in by hand: every extracted field starts checked, but the user
 * sees exactly what would change and can uncheck anything before Apply.
 */
export function ResumeImportDialog({ open, onOpenChange, onApply }: ResumeImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [selected, setSelected] = useState<Record<FieldKey, boolean>>({
    name: true,
    title: true,
    summary: true,
    skills: true,
    languages: true,
    experience: true,
    education: true,
  });

  function reset() {
    setError(null);
    setExtracted(null);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFileSelected(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type — upload a PDF or DOCX resume.');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ExtractedProfile>('/users/me/resume-import', formData);
      setExtracted(res.data);
      // Only pre-check fields that actually came back with something —
      // an empty skills list, for instance, shouldn't look selectable.
      setSelected({
        name: Boolean(res.data.name),
        title: Boolean(res.data.title),
        summary: Boolean(res.data.summary),
        skills: res.data.skills.length > 0,
        languages: res.data.languages.length > 0,
        experience: res.data.experience.length > 0,
        education: res.data.education.length > 0,
      });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const message = axiosErr.response?.data?.message;
      const description = Array.isArray(message)
        ? message.join(', ')
        : message ?? 'Failed to read that resume';
      setError(description);
      toast.error(description);
    } finally {
      setIsUploading(false);
    }
  }

  function handleApply() {
    if (!extracted) return;
    const fields: Partial<ExtractedProfile> = {};
    (Object.keys(selected) as FieldKey[]).forEach((key) => {
      if (selected[key]) {
        (fields as Record<FieldKey, unknown>)[key] = extracted[key];
      }
    });
    onApply(fields);
    toast.success('Applied to profile — review the fields below, then Save profile.');
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from resume</DialogTitle>
          <DialogDescription>
            Upload a PDF or Word resume — we&apos;ll extract what we can. Nothing is saved until
            you review and click Apply, then Save profile.
          </DialogDescription>
        </DialogHeader>

        {!extracted && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center transition hover:border-primary hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {isUploading ? 'Reading your resume…' : 'Click to choose a file'}
              </span>
              <span className="text-xs text-muted-foreground">PDF or DOCX, up to 5MB</span>
            </button>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        {extracted && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose what to bring into your profile — anything unchecked stays as it is.
            </p>

            <FieldRow
              label="Name"
              checked={selected.name}
              disabled={!extracted.name}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, name: v }))}
            >
              {extracted.name ?? <Empty />}
            </FieldRow>

            <FieldRow
              label="Title"
              checked={selected.title}
              disabled={!extracted.title}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, title: v }))}
            >
              {extracted.title ?? <Empty />}
            </FieldRow>

            <FieldRow
              label="Summary"
              checked={selected.summary}
              disabled={!extracted.summary}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, summary: v }))}
            >
              {extracted.summary ?? <Empty />}
            </FieldRow>

            <FieldRow
              label="Skills"
              checked={selected.skills}
              disabled={extracted.skills.length === 0}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, skills: v }))}
            >
              {extracted.skills.length > 0 ? extracted.skills.join(', ') : <Empty />}
            </FieldRow>

            <FieldRow
              label="Languages"
              checked={selected.languages}
              disabled={extracted.languages.length === 0}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, languages: v }))}
            >
              {extracted.languages.length > 0 ? extracted.languages.join(', ') : <Empty />}
            </FieldRow>

            <FieldRow
              label={`Experience (${extracted.experience.length})`}
              checked={selected.experience}
              disabled={extracted.experience.length === 0}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, experience: v }))}
            >
              {extracted.experience.length > 0 ? (
                <ul className="space-y-1">
                  {extracted.experience.map((exp, i) => (
                    <li key={i}>
                      {exp.role} at {exp.company} ({exp.duration})
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </FieldRow>

            <FieldRow
              label={`Education (${extracted.education.length})`}
              checked={selected.education}
              disabled={extracted.education.length === 0}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, education: v }))}
            >
              {extracted.education.length > 0 ? (
                <ul className="space-y-1">
                  {extracted.education.map((edu, i) => (
                    <li key={i}>
                      {edu.degree}, {edu.institution} ({edu.duration})
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </FieldRow>
          </div>
        )}

        <DialogFooter>
          {extracted ? (
            <>
              <Button variant="outline" onClick={() => reset()}>
                Start over
              </Button>
              <Button onClick={handleApply}>Apply to profile</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty() {
  return <span className="italic text-muted-foreground">Nothing found</span>;
}

function FieldRow({
  label,
  checked,
  disabled,
  onCheckedChange,
  children,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3 text-sm has-[:disabled]:opacity-60">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <span className="flex-1">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-foreground">{children}</span>
      </span>
    </label>
  );
}
