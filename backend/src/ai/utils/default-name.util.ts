/** e.g. defaultName("Resume") -> "Resume – Aug 27, 6:15 PM" */
export function defaultName(prefix: string): string {
  const formatted = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${prefix} – ${formatted}`;
}
