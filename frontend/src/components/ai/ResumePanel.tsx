'use client';

import { Download } from 'lucide-react';
import { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { ResumeTemplate } from './ResumeTemplate';

interface ResumePanelProps {
  user: UserProfile;
}

const REQUIRED_FIELDS_FILLED = (user: UserProfile) =>
  Boolean(user.summary) || user.experience.length > 0 || user.education.length > 0 || user.skills.length > 0;

/**
 * Renders a one-page resume live from the profile — no AI call, no saved
 * history. Since this is a pure function of the profile, "generate" and
 * "regenerate" aren't separate steps: it's just always current, and edits
 * on the Profile tab show up here immediately without an extra button.
 */
export function ResumePanel({ user }: ResumePanelProps) {
  const hasContent = REQUIRED_FIELDS_FILLED(user);

  function handleDownloadPdf() {
    // No PDF library needed — the browser's own print pipeline produces a
    // real, selectable-text PDF when the user picks "Save as PDF" as the
    // destination. dashboard/page.tsx + the print: classes hide everything
    // except the resume itself for this print pass.
    window.print();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-muted-foreground">
          Rendered live from your profile — edit the Profile tab and it updates here automatically.
        </p>
        {hasContent && (
          <Button onClick={handleDownloadPdf} className="shrink-0">
            <Download />
            Download PDF
          </Button>
        )}
      </div>

      {hasContent ? (
        <ResumeTemplate user={user} />
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center print:hidden">
          <p className="text-sm text-muted-foreground">
            Your profile is empty — fill in the Profile tab to generate your resume.
          </p>
        </div>
      )}
    </div>
  );
}
