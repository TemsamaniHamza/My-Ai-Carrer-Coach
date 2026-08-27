'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Download, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResumeListItem {
  id: string;
  name: string;
  createdAt: string;
  preview: string;
}

export function ResumePanel() {
  const [history, setHistory] = useState<ResumeListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingOne, setIsLoadingOne] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function fetchHistory() {
    return api
      .get<ResumeListItem[]>('/ai/resumes')
      .then((res) => {
        setHistory(res.data);
        return res.data;
      })
      .catch(() => {
        /* history is a nice-to-have — a failed load isn't worth surfacing as an error */
        return [];
      });
  }

  // On mount (including after a reload, or after logging back in), if a past
  // resume exists, load the most recent one automatically — otherwise the
  // viewer sits empty until the user notices the history row and clicks it,
  // which reads as "my resume is gone" even though it's still saved.
  useEffect(() => {
    fetchHistory().then((items) => {
      if (items.length > 0) handleSelectHistoryItem(items[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await api.post<{ id: string; markdown: string }>('/ai/resumes');
      setMarkdown(res.data.markdown);
      setSelectedId(res.data.id);
      await fetchHistory(); // refetch so name/preview reflect the real saved row
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const message = axiosErr.response?.data?.message;
      const description = Array.isArray(message)
        ? message.join(', ')
        : message ?? 'Failed to generate resume';
      setError(description);
      toast.error(description);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSelectHistoryItem(id: string) {
    if (id === selectedId) return;
    setError(null);
    setIsLoadingOne(true);
    try {
      const res = await api.get<{ id: string; markdown: string }>(`/ai/resumes/${id}`);
      setMarkdown(res.data.markdown);
      setSelectedId(res.data.id);
    } catch {
      setError('Failed to load that resume');
    } finally {
      setIsLoadingOne(false);
    }
  }

  function startRename(item: ResumeListItem) {
    setEditingId(item.id);
    setDraftName(item.name);
  }

  async function handleSaveRename(id: string) {
    const name = draftName.trim();
    setEditingId(null);
    if (!name) return; // don't save an empty name — just cancel silently
    try {
      await api.patch(`/ai/resumes/${id}`, { name });
      setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
    } catch {
      toast.error('Failed to rename that resume');
    }
  }

  function requestDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    if (!id) return;
    setError(null);
    try {
      await api.delete(`/ai/resumes/${id}`);
      const remaining = history.filter((item) => item.id !== id);
      setHistory(remaining);
      if (id === selectedId) {
        // Deleted the one currently shown — fall back to the next most
        // recent, or clear the viewer entirely if none are left.
        if (remaining.length > 0) {
          setSelectedId(null); // so handleSelectHistoryItem's id===selectedId guard doesn't skip it
          handleSelectHistoryItem(remaining[0].id);
        } else {
          setSelectedId(null);
          setMarkdown(null);
        }
      }
    } catch {
      toast.error('Failed to delete that resume');
    }
  }

  function handleDownloadPdf() {
    // No PDF library needed — the browser's own print pipeline produces a
    // real, selectable-text PDF when the user picks "Save as PDF" as the
    // destination. dashboard/page.tsx + the print: classes below hide
    // everything except the resume itself for this print pass.
    window.print();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-muted-foreground">
          Generates a resume from your saved profile — fill in the Profile tab first.
        </p>
        <div className="flex shrink-0 gap-2">
          {markdown && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download />
              Download PDF
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles />
            {isGenerating ? 'Generating…' : 'Generate Resume'}
          </Button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-4 space-y-1 print:hidden">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Past Resumes</p>
          {history.map((item) => (
            <div
              key={item.id}
              data-testid="resume-history-item"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                item.id === selectedId ? 'border-primary bg-primary/5' : ''
              }`}
            >
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => handleSaveRename(item.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(item.id)}
                  className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                />
              ) : (
                <button
                  onClick={() => handleSelectHistoryItem(item.id)}
                  title={item.preview}
                  className="flex-1 truncate text-left text-foreground hover:underline"
                >
                  {item.name}
                </button>
              )}
              <button
                onClick={() => startRename(item)}
                aria-label={`Rename ${item.name}`}
                title="Rename"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => requestDelete(item.id)}
                aria-label={`Delete ${item.name}`}
                title="Delete"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive print:hidden">
          {error}
        </p>
      )}

      {markdown && !isLoadingOne && (
        <div className="prose prose-sm max-w-none rounded-md border p-6 print:border-0 print:p-0">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}

      {!markdown && !isLoadingOne && !isGenerating && (
        <div className="rounded-md border border-dashed p-8 text-center print:hidden">
          <p className="text-sm text-muted-foreground">
            No resume yet — click &ldquo;Generate Resume&rdquo; above to create your first one.
          </p>
        </div>
      )}

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
