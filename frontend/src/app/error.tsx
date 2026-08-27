'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Next.js renders this instead of its raw default crash screen whenever a
// render throws anywhere under this route tree — keeps a broken screen on
// brand instead of showing framework internals to whoever is watching.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged client-side so it shows up in the browser console (and the
    // Vercel deployment's runtime logs) instead of vanishing silently.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Back to dashboard</a>
        </Button>
      </div>
    </main>
  );
}
