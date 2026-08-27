'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  InterviewMessage,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewType,
  StartSessionResponse,
  SubmitAnswerResponse,
} from '@/types/interview';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

type ChatState = 'idle' | 'active' | 'completed';

const INTERVIEW_TYPES: { value: InterviewType; label: string; description: string }[] = [
  {
    value: 'behavioral',
    label: 'Behavioral',
    description: 'Past experience, teamwork, decisions',
  },
  { value: 'technical', label: 'Technical', description: "Questions grounded in your skills" },
  { value: 'mixed', label: 'Mixed', description: 'A bit of both' },
];

function ChatAvatar({ role, initial }: { role: 'assistant' | 'user'; initial: string }) {
  return (
    <Avatar className={`h-7 w-7 ${role === 'user' ? 'border' : ''}`}>
      <AvatarFallback
        className={
          role === 'assistant'
            ? 'bg-primary/10 text-sm text-primary'
            : 'bg-primary text-xs font-semibold text-primary-foreground'
        }
      >
        {role === 'assistant' ? '🎤' : initial}
      </AvatarFallback>
    </Avatar>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <ChatAvatar role="assistant" initial="" />
      <div className="flex items-center gap-1 rounded-md bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function computeSummary(messages: InterviewMessage[]) {
  const scores = messages
    .filter((m) => m.role === 'user' && m.evaluation)
    .map((m) => m.evaluation!.score);
  if (scores.length === 0) return null;
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const label =
    average >= 8
      ? 'Excellent performance'
      : average >= 6
        ? 'Strong performance'
        : average >= 4
          ? 'Good effort — room to grow'
          : 'Needs more practice';
  return { average: Math.round(average * 10) / 10, label };
}

type Tab = 'home' | 'profile' | 'resume' | 'cover-letter' | 'interview';

interface InterviewChatProps {
  onNavigate: (tab: Tab) => void;
}

export function InterviewChat({ onNavigate }: InterviewChatProps) {
  const { user, refreshUser } = useAuth();
  const userInitial = user?.name?.trim()?.[0]?.toUpperCase() ?? 'Y';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [state, setState] = useState<ChatState>('idle');
  const [selectedType, setSelectedType] = useState<InterviewType>('mixed');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [history, setHistory] = useState<InterviewSessionListItem[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<InterviewSessionDetail | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<InterviewSessionListItem[]>('/ai/interview/sessions')
      .then((res) => setHistory(res.data))
      .catch(() => {
        /* history is a nice-to-have — a failed load isn't worth surfacing as an error */
      });
  }, []);

  function extractErrorMessage(err: unknown): string {
    const axiosErr = err as AxiosError<{ message?: string | string[] }>;
    const message = axiosErr.response?.data?.message;
    return Array.isArray(message) ? message.join(', ') : message ?? 'Something went wrong';
  }

  async function handleStart() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.post<StartSessionResponse>('/ai/interview/sessions', {
        type: selectedType,
      });
      setSessionId(res.data.sessionId);
      setMessages([
        { role: 'assistant', content: res.data.question, evaluation: null, createdAt: '' },
      ]);
      setProgress({ current: 1, total: 5 });
      setState('active');
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sessionId || !answer.trim()) return;
    setError(null);
    setIsLoading(true);

    const submittedAnswer = answer;
    setAnswer('');

    try {
      const res = await api.post<SubmitAnswerResponse>(
        `/ai/interview/sessions/${sessionId}/answer`,
        { answer: submittedAnswer },
      );

      setMessages((prev) => {
        const next: InterviewMessage[] = [
          ...prev,
          {
            role: 'user',
            content: submittedAnswer,
            evaluation: res.data.evaluation,
            createdAt: '',
          },
        ];
        if (res.data.nextQuestion) {
          next.push({
            role: 'assistant',
            content: res.data.nextQuestion,
            evaluation: null,
            createdAt: '',
          });
        }
        return next;
      });

      // questionNumber from the API is the question that was just answered —
      // once a nextQuestion is shown, the progress label should reflect that
      // new question, not the one just completed.
      const displayedQuestionNumber = res.data.nextQuestion
        ? res.data.questionNumber + 1
        : res.data.questionNumber;
      setProgress({ current: displayedQuestionNumber, total: res.data.totalQuestions });

      if (res.data.status === 'completed') {
        setState('completed');
        // Refresh history so this session shows up in "Past Interviews" too.
        api
          .get<InterviewSessionListItem[]>('/ai/interview/sessions')
          .then((r) => setHistory(r.data))
          .catch(() => {});
        // The backend updates strengthsWeaknesses on the User as a side
        // effect of completing an interview — refetch it so Home shows the
        // new summary immediately instead of a stale in-memory user.
        refreshUser().catch(() => {});
      }
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
      setAnswer(submittedAnswer); // give the answer back so it isn't lost on failure
    } finally {
      setIsLoading(false);
    }
  }

  function handleRestart() {
    setSessionId(null);
    setMessages([]);
    setProgress(null);
    setAnswer('');
    setError(null);
    setState('idle');
  }

  async function handleViewHistory(id: string) {
    setError(null);
    setViewingHistoryId(id);
    setIsLoadingHistory(true);
    try {
      const res = await api.get<InterviewSessionDetail>(`/ai/interview/sessions/${id}`);
      setHistoryDetail(res.data);
    } catch {
      setError('Failed to load that interview');
      toast.error('Failed to load that interview');
      setViewingHistoryId(null);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function handleBackFromHistory() {
    setViewingHistoryId(null);
    setHistoryDetail(null);
  }

  function handleDeleteHistory(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDeleteHistory() {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    if (!id) return;
    setError(null);
    try {
      await api.delete(`/ai/interview/sessions/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      // If it was open in the read-only viewer, back out of that view too.
      if (viewingHistoryId === id) {
        setViewingHistoryId(null);
        setHistoryDetail(null);
      }
    } catch {
      setError('Failed to delete that interview');
      toast.error('Failed to delete that interview');
    }
  }

  // An "active" session in history was left mid-interview (tab closed, etc.)
  // — the backend already accepts more answers for it, so drop the user
  // straight back into the live chat instead of the read-only viewer.
  async function handleContinueHistory(id: string) {
    setError(null);
    setIsLoadingHistory(true);
    try {
      const res = await api.get<InterviewSessionDetail>(`/ai/interview/sessions/${id}`);
      const assistantCount = res.data.messages.filter((m) => m.role === 'assistant').length;
      setSessionId(res.data.id);
      setMessages(res.data.messages);
      setProgress({ current: assistantCount, total: 5 });
      setState('active');
    } catch {
      setError('Failed to resume that interview');
      toast.error('Failed to resume that interview');
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const pendingDeleteItem = history.find((item) => item.id === pendingDeleteId) ?? null;

  const deleteDialog = (
    <AlertDialog
      open={pendingDeleteId !== null}
      onOpenChange={(open) => !open && setPendingDeleteId(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDeleteItem?.firstQuestion
              ? `"${pendingDeleteItem.firstQuestion}" will be permanently deleted. This can't be undone.`
              : "This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteHistory}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // --- Viewing a past session, read-only ---
  if (viewingHistoryId) {
    const summary = historyDetail ? computeSummary(historyDetail.messages) : null;
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="link" className="h-auto p-0 text-muted-foreground" onClick={handleBackFromHistory}>
            ← Back to Interview Prep
          </Button>
          <Button
            variant="link"
            className="h-auto p-0 text-destructive"
            onClick={() => handleDeleteHistory(viewingHistoryId)}
          >
            Delete this interview
          </Button>
        </div>

        {isLoadingHistory && <p className="text-sm text-muted-foreground">Loading…</p>}

        {historyDetail && (
          <>
            {summary && (
              <div className="mb-4 rounded-md bg-muted px-4 py-3 text-sm text-foreground">
                <span className="font-semibold">{summary.label}</span> — average score{' '}
                {summary.average}/10
              </div>
            )}
            <div className="space-y-4">
              {historyDetail.messages.map((message, index) => (
                <MessageBubble key={index} message={message} userInitial={userInitial} />
              ))}
            </div>
          </>
        )}

        {deleteDialog}
      </div>
    );
  }

  // --- Idle: intro + start + history list ---
  if (state === 'idle') {
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          Practice a 5-question mock interview based on your saved profile. Gemini asks
          questions, evaluates each answer, and follows up based on what you say.
        </p>

        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Interview type</p>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {INTERVIEW_TYPES.map((t) => (
            <Card
              key={t.value}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedType(t.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedType(t.value);
              }}
              className={`cursor-pointer p-3 text-left text-sm shadow-none transition ${
                selectedType === t.value ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'
              }`}
            >
              <span className="block font-medium text-foreground">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.description}</span>
            </Card>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button onClick={handleStart} disabled={isLoading}>
          {isLoading ? 'Starting…' : 'Start Interview'}
        </Button>

        {history.length > 0 && (
          <div className="mt-8">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Past Interviews
            </p>
            <div className="space-y-1">
              {history.map((item) => {
                const isActive = item.status === 'active';
                return (
                  <div
                    key={item.id}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <button
                      onClick={() =>
                        isActive ? handleContinueHistory(item.id) : handleViewHistory(item.id)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left hover:text-primary"
                    >
                      <span className="truncate text-foreground">
                        {item.firstQuestion ?? 'Interview'}
                      </span>
                      <Badge variant="secondary" className="shrink-0 font-normal capitalize">
                        {item.type}
                      </Badge>
                      <Badge
                        className={`shrink-0 border-transparent font-normal shadow-none hover:bg-current/10 ${
                          isActive
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </button>
                    {isActive && (
                      <Button
                        size="sm"
                        className="ml-3 h-7 shrink-0 whitespace-nowrap px-2.5 text-xs"
                        onClick={() => handleContinueHistory(item.id)}
                      >
                        Continue
                      </Button>
                    )}
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      aria-label="Delete interview"
                      title="Delete"
                      className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {deleteDialog}
      </div>
    );
  }

  // --- Active or just-completed live interview ---
  const liveSummary = state === 'completed' ? computeSummary(messages) : null;

  return (
    <div>
      {progress && (
        <p className="mb-4 text-xs font-medium uppercase text-muted-foreground">
          Question {progress.current} of {progress.total}
        </p>
      )}

      <div className="mb-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} userInitial={userInitial} />
        ))}
        {isLoading && state === 'active' && <TypingIndicator />}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {state === 'active' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            rows={3}
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer…"
          />
          <Button type="submit" disabled={isLoading || !answer.trim()}>
            {isLoading ? 'Evaluating…' : 'Send Answer'}
          </Button>
        </form>
      )}

      {state === 'completed' && (
        <div>
          <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Interview complete</p>
            {liveSummary && (
              <p className="mt-1">
                {liveSummary.label} — average score {liveSummary.average}/10
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRestart}>
              Start another interview
            </Button>
            <Button onClick={() => onNavigate('home')}>
              See your Strengths &amp; Weaknesses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {deleteDialog}
    </div>
  );
}

function MessageBubble({
  message,
  userInitial,
}: {
  message: InterviewMessage;
  userInitial: string;
}) {
  if (message.role === 'assistant') {
    return (
      <div className="flex items-start gap-2">
        <ChatAvatar role="assistant" initial="" />
        <div className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-end gap-2">
      <div className="max-w-[85%]">
        <div className="rounded-md border px-4 py-3 text-sm text-foreground">
          {message.content}
        </div>
        {message.evaluation && (
          <div className="mt-2 rounded-md bg-primary/10 px-4 py-3 text-sm text-foreground">
            <span className="font-semibold">Score: {message.evaluation.score}/10</span>
            <p className="mt-1">{message.evaluation.feedback}</p>
          </div>
        )}
      </div>
      <ChatAvatar role="user" initial={userInitial} />
    </div>
  );
}
