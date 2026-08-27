import Link from 'next/link';
import { FileText, Mail, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS = [
  { icon: Mic, label: 'Live mock interviews with AI feedback' },
  { icon: FileText, label: 'One-click, ATS-friendly resumes' },
  { icon: Mail, label: 'Cover letters tailored to the job' },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted/40 px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-primary shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered career prep
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          AI Career Coach
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Build your profile once, then let AI turn it into a resume, a tailored cover letter, and
          real interview practice — all from the same source of truth.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Log in</Link>
          </Button>
        </div>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 text-xs text-muted-foreground shadow-sm"
            >
              <Icon className="h-5 w-5 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
