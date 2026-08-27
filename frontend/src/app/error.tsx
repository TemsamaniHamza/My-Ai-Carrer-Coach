'use client';

import { useEffect } from 'react';

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-gray-500">
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
