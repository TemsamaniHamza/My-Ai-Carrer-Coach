import { Mail, MapPin } from 'lucide-react';
import { UserProfile } from '@/types/user';

interface ResumeTemplateProps {
  user: UserProfile;
}

/**
 * A deterministic, professional one-page resume rendered straight from the
 * profile — no AI call. Designed to be captured with the browser's own
 * print-to-PDF pipeline (see ResumePanel's handleDownloadPdf), so every
 * class here has to survive that: fixed-ish sizing, print-safe colors, and
 * no element that could push a real profile past one page for a normal
 * amount of content.
 */
export function ResumeTemplate({ user }: ResumeTemplateProps) {
  const hasContact = user.email;

  return (
    <div className="resume-page mx-auto w-full max-w-[8.5in] bg-white text-neutral-900 print:max-w-none">
      {/* Header */}
      <header className="border-b-[3px] border-neutral-900 pb-4">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{user.name}</h1>
        {user.title && (
          <p className="mt-0.5 text-[15px] font-medium text-neutral-600">{user.title}</p>
        )}
        {hasContact && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-600">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </span>
            {user.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user.languages.join(', ')}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-x-6">
        {/* Sidebar */}
        <aside className="space-y-5">
          {user.skills.length > 0 && (
            <Section title="Skills">
              <ul className="space-y-1 text-[11.5px] leading-snug text-neutral-800">
                {user.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </Section>
          )}

          {user.education.length > 0 && (
            <Section title="Education">
              <div className="space-y-3">
                {user.education.map((edu, i) => (
                  <div key={i} className="text-[11.5px] leading-snug">
                    <p className="font-semibold text-neutral-900">{edu.institution}</p>
                    <p className="text-neutral-700">{edu.degree}</p>
                    <p className="text-neutral-500">{edu.duration}</p>
                    {edu.description && (
                      <p className="mt-0.5 text-neutral-600">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {user.languages.length > 0 && (
            <Section title="Languages">
              <ul className="space-y-1 text-[11.5px] leading-snug text-neutral-800">
                {user.languages.map((lang) => (
                  <li key={lang}>{lang}</li>
                ))}
              </ul>
            </Section>
          )}
        </aside>

        {/* Main column */}
        <main className="space-y-5">
          {user.summary && (
            <Section title="Summary">
              <p className="text-[11.5px] leading-relaxed text-neutral-800">{user.summary}</p>
            </Section>
          )}

          {user.experience.length > 0 && (
            <Section title="Experience">
              <div className="space-y-4">
                {user.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-neutral-900">{exp.role}</p>
                      <p className="shrink-0 text-[10.5px] text-neutral-500">{exp.duration}</p>
                    </div>
                    <p className="text-[11.5px] font-medium text-neutral-600">{exp.company}</p>
                    {exp.description && (
                      <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-700">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </main>
      </div>

      {!user.summary &&
        user.experience.length === 0 &&
        user.education.length === 0 &&
        user.skills.length === 0 && (
          <p className="mt-6 text-sm text-neutral-500">
            Your profile is empty — fill in the Profile tab to see it rendered here.
          </p>
        )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}
