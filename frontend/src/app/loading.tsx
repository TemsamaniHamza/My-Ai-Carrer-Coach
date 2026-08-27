// Shown automatically during route transitions (e.g. / -> /login) while the
// next page's data/JS is still loading — replaces a blank flash with a
// lightweight, on-brand placeholder.
export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Loading…</p>
    </main>
  );
}
