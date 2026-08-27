'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';

interface CoverLetterListItem {
  id: string;
  name: string;
  createdAt: string;
  preview: string;
}

export function CoverLetterPanel() {
  const [jobDescription, setJobDescription] = useState('');
  const [history, setHistory] = useState<CoverLetterListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingOne, setIsLoadingOne] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  function fetchHistory() {
    return api
      .get<CoverLetterListItem[]>('/ai/cover-letters')
      .then((res) => {
        setHistory(res.data);
        return res.data;
      })
      .catch(() => {
        /* history is a nice-to-have — a failed load isn't worth surfacing as an error */
        return [];
      });
  }

  // Same reasoning as ResumePanel — auto-load the latest saved one on mount
  // so a reload/relogin doesn't make it look like it disappeared.
  useEffect(() => {
    fetchHistory().then((items) => {
      if (items.length > 0) handleSelectHistoryItem(items[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    try {
      const res = await api.post<{ id: string; letter: string }>('/ai/cover-letters', {
        jobDescription,
      });
      setLetter(res.data.letter);
      setSelectedId(res.data.id);
      await fetchHistory();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const message = axiosErr.response?.data?.message;
      setError(
        Array.isArray(message) ? message.join(', ') : message ?? 'Failed to generate cover letter',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSelectHistoryItem(id: string) {
    if (id === selectedId) return;
    setError(null);
    setIsLoadingOne(true);
    try {
      const res = await api.get<{ id: string; letter: string }>(`/ai/cover-letters/${id}`);
      setLetter(res.data.letter);
      setSelectedId(res.data.id);
    } catch {
      setError('Failed to load that cover letter');
    } finally {
      setIsLoadingOne(false);
    }
  }

  function startRename(item: CoverLetterListItem) {
    setEditingId(item.id);
    setDraftName(item.name);
  }

  async function handleSaveRename(id: string) {
    const name = draftName.trim();
    setEditingId(null);
    if (!name) return;
    try {
      await api.patch(`/ai/cover-letters/${id}`, { name });
      setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
    } catch {
      setError('Failed to rename that cover letter');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved cover letter? This can\'t be undone.')) return;
    setError(null);
    try {
      await api.delete(`/ai/cover-letters/${id}`);
      const remaining = history.filter((item) => item.id !== id);
      setHistory(remaining);
      if (id === selectedId) {
        if (remaining.length > 0) {
          setSelectedId(null);
          handleSelectHistoryItem(remaining[0].id);
        } else {
          setSelectedId(null);
          setLetter(null);
        }
      }
    } catch {
      setError('Failed to delete that cover letter');
    }
  }

  function handleDownloadPdf() {
    // Same browser print-to-PDF approach as the Resume tab — real
    // selectable text, no library, no server changes.
    window.print();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4 space-y-3 print:hidden">
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
          Paste the job description
        </label>
        <textarea
          id="jobDescription"
          rows={8}
          required
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job posting here…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isGenerating || !jobDescription.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating…' : 'Generate Cover Letter'}
        </button>
      </form>

      {history.length > 0 && (
        <div className="mb-4 space-y-1 print:hidden">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">Past Cover Letters</p>
          {history.map((item) => (
            <div
              key={item.id}
              data-testid="cover-letter-history-item"
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                item.id === selectedId ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => handleSaveRename(item.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(item.id)}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-600 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => handleSelectHistoryItem(item.id)}
                  title={item.preview}
                  className="flex-1 truncate text-left text-gray-800 hover:underline"
                >
                  {item.name}
                </button>
              )}
              <button
                onClick={() => startRename(item)}
                aria-label={`Rename ${item.name}`}
                title="Rename"
                className="shrink-0 text-gray-400 hover:text-gray-700"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                aria-label={`Delete ${item.name}`}
                title="Delete"
                className="shrink-0 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden">
          {error}
        </p>
      )}

      {letter && !isLoadingOne && (
        <div>
          <div className="mb-2 flex justify-end gap-2 print:hidden">
            <button
              onClick={handleDownloadPdf}
              className="whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Download PDF
            </button>
          </div>
          <div className="whitespace-pre-wrap rounded-md border border-gray-200 p-6 text-sm text-gray-800 print:border-0 print:p-0">
            {letter}
          </div>
        </div>
      )}

      {!letter && !isLoadingOne && !isGenerating && (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center print:hidden">
          <p className="text-sm text-gray-500">
            No cover letter yet — paste a job description above and click &ldquo;Generate Cover
            Letter&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
