import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">AI Career Coach</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Build your profile, then generate a resume, a cover letter, and practice interview
          answers — all powered by AI.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
