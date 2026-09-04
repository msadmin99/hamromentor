"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Drawer from "@/components/Drawer";
import RequireAuth from "@/components/RequireAuth";
import { CheckCircleIcon } from "@/components/icons";
import NotesPopover, { hasNote } from "@/components/testplayer/NotesPopover";
import QuestionNavigatorPanel from "@/components/testplayer/QuestionNavigatorPanel";
import QuestionWorkspace from "@/components/testplayer/QuestionWorkspace";
import ReviewAnswersModal from "@/components/testplayer/ReviewAnswersModal";
import TestPlayerHeader from "@/components/testplayer/TestPlayerHeader";
import TestProgressPanel from "@/components/testplayer/TestProgressPanel";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

function AttemptContent() {
  const { attemptId } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [remaining, setRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false); // mobile drawer
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false); // desktop rail
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notesQuestionId, setNotesQuestionId] = useState(null);
  const [noteVersion, setNoteVersion] = useState(0); // bumps to re-read localStorage note markers
  const submittedRef = useRef(false);
  const pageShownAtRef = useRef(Date.now());
  const questionRefs = useRef(new Map());
  const scrollTargetRef = useRef(null);
  const expiresAtRef = useRef(null);

  useEffect(() => {
    pageShownAtRef.current = Date.now();
  }, [page]);

  // Previously had no .catch() at all — a failed request (network blip,
  // 500) left the page on a bare "Loading test…" forever, with no way to
  // retry short of a full page reload. The success branch below is
  // byte-for-byte unchanged; only the new .catch() and the reusable
  // function wrapper (so Retry can call the exact same logic) are new. No
  // synchronous state reset before the fetch, so this can't trip
  // react-hooks/set-state-in-effect the way an eager reset would.
  function load() {
    api
      .get(`/attempts/${attemptId}/`)
      .then((data) => {
        if (data.status === "submitted") {
          router.replace(`/tests/result/${attemptId}`);
          return;
        }
        setAttempt(data);
        setLoadError(false);

        // Restore progress instead of starting blank — the actual bug fix,
        // not just the redesign.
        const restoredAnswers = {};
        const restoredMarked = {};
        Object.entries(data.answers || {}).forEach(([qId, a]) => {
          if (a.option_id != null) restoredAnswers[qId] = a.option_id;
          if (a.is_marked_for_review) restoredMarked[qId] = true;
        });
        setAnswers(restoredAnswers);
        setMarked(restoredMarked);
        const restoredBookmarks = {};
        (data.questions || []).forEach((q) => {
          if (q.is_bookmarked) restoredBookmarks[q.id] = true;
        });
        setBookmarked(restoredBookmarks);

        // Phase 6: effective_end_at (start_time + duration, capped by the
        // exam session's own end if one exists and is sooner) is now the
        // real, server-enforced deadline — falls back to the old
        // duration-only computation only if an older cached response
        // somehow lacks the field. Display-only either way: the backend
        // independently re-checks and rejects a late answer/submit
        // regardless of what this timer shows.
        const expiresAt = data.effective_end_at
          ? new Date(data.effective_end_at).getTime()
          : new Date(data.start_time).getTime() + data.duration_minutes * 60 * 1000;
        expiresAtRef.current = expiresAt;
        setRemaining((expiresAt - Date.now()) / 1000);
      })
      .catch(() => setLoadError(true));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, router]);

  const submitTest = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await api.post(`/attempts/${attemptId}/submit/`);
      router.push(`/tests/result/${attemptId}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, router]);

  // Countdown ticks locally, but resyncs against the server-derived expiry
  // (start_time + duration_minutes) on every tick and whenever the tab
  // regains focus — reduces visible drift from background-tab throttling
  // without changing submission-acceptance behavior on the backend.
  useEffect(() => {
    if (remaining == null) return undefined;
    if (remaining <= 0) {
      submitTest();
      return undefined;
    }
    const timer = setInterval(() => {
      if (!expiresAtRef.current) return;
      const next = (expiresAtRef.current - Date.now()) / 1000;
      if (next <= 0) {
        clearInterval(timer);
        submitTest();
        return;
      }
      setRemaining(next);
    }, 1000);
    function onVisible() {
      if (document.visibilityState === "visible" && expiresAtRef.current) {
        setRemaining((expiresAtRef.current - Date.now()) / 1000);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining != null]);

  const perPage = Math.max(1, attempt?.questions_per_page || 1);
  const totalPages = attempt ? Math.max(1, Math.ceil(attempt.questions.length / perPage)) : 1;
  const pageQuestions = attempt ? attempt.questions.slice(page * perPage, (page + 1) * perPage) : [];
  const pageStart = page * perPage;

  useEffect(() => {
    if (scrollTargetRef.current == null) return;
    const el = questionRefs.current.get(scrollTargetRef.current);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTargetRef.current = null;
  }, [page, pageQuestions]);

  async function selectOption(question, optionId) {
    setAnswers((a) => ({ ...a, [question.id]: optionId }));
    try {
      await api.post(`/attempts/${attemptId}/answer/`, {
        question_id: question.id,
        option_id: optionId,
        mark_for_review: !!marked[question.id],
        time_taken_seconds: Math.round((Date.now() - pageShownAtRef.current) / 1000),
      });
    } catch {
      // best-effort; local state stays the UI's source of truth for unsent answers
    }
  }

  async function toggleMark(question) {
    const next = !marked[question.id];
    setMarked((m) => ({ ...m, [question.id]: next }));
    try {
      await api.post(`/attempts/${attemptId}/mark-review/`, { question_id: question.id, marked: next });
    } catch {
      setMarked((m) => ({ ...m, [question.id]: !next }));
    }
  }

  async function toggleBookmark(question) {
    const next = !bookmarked[question.id];
    setBookmarked((b) => ({ ...b, [question.id]: next }));
    try {
      await api.post(`/questions/${question.id}/bookmark/`, { bookmark: next });
    } catch {
      setBookmarked((b) => ({ ...b, [question.id]: !next }));
    }
  }

  const goToQuestion = useCallback(
    (globalIndex) => {
      const targetPage = Math.floor(globalIndex / perPage);
      const targetQuestion = attempt?.questions[globalIndex];
      scrollTargetRef.current = targetQuestion?.id ?? null;
      if (targetPage === page) {
        const el = targetQuestion && questionRefs.current.get(targetQuestion.id);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        scrollTargetRef.current = null;
      } else {
        setPage(targetPage);
      }
      setNavigatorOpen(false);
    },
    [attempt, page, perPage],
  );

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const currentQuestion = pageQuestions[0];

  if (loadError) {
    return (
      <div className="hm-app-shell flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ErrorCard title="Unable to load test." onRetry={load} />
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="hm-app-shell">
        <div className="hm-header-gradient p-4">
          <div className="h-4 w-40 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-white/15" />
        </div>
        <div className="hm-page flex flex-col gap-4">
          <div className="hm-card animate-pulse p-4">
            <div className="h-3 w-24 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-3 h-4 w-full rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-1.5 h-4 w-2/3 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-4 flex flex-col gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 rounded-xl bg-[var(--color-surface-muted)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hm-app-shell">
      <TestPlayerHeader
        title={attempt.test_title}
        currentQuestionNumber={pageStart + 1}
        totalQuestions={attempt.questions.length}
        answeredCount={answeredCount}
        remaining={remaining}
        onOpenNavigator={() => setNavigatorOpen(true)}
      />

      <div className="hm-page grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-[auto_1fr_260px]">
        <aside className={`hidden md:block ${navigatorCollapsed ? "w-12" : "w-64"} transition-all`}>
          <div className="hm-card sticky top-20 p-3">
            <button
              type="button"
              onClick={() => setNavigatorCollapsed((c) => !c)}
              aria-label={navigatorCollapsed ? "Expand question navigator" : "Collapse question navigator"}
              className="mb-2 flex w-full items-center justify-end text-[var(--color-text-muted)]"
            >
              {navigatorCollapsed ? "»" : "«"}
            </button>
            {!navigatorCollapsed && (
              <QuestionNavigatorPanel
                questions={attempt.questions}
                answers={answers}
                marked={marked}
                currentQuestionId={currentQuestion?.id}
                onJump={goToQuestion}
                answeredCount={answeredCount}
              />
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {pageQuestions.map((q, qi) => {
            const globalIndex = pageStart + qi;
            return (
              <QuestionWorkspace
                key={q.id}
                workspaceRef={(el) => {
                  if (el) questionRefs.current.set(q.id, el);
                }}
                question={q}
                questionNumber={globalIndex + 1}
                standalone={pageQuestions.length === 1}
                selectedOptionId={answers[q.id]}
                onSelectOption={(optionId) => selectOption(q, optionId)}
                marked={!!marked[q.id]}
                onToggleMark={() => toggleMark(q)}
                bookmarked={!!bookmarked[q.id]}
                onToggleBookmark={() => toggleBookmark(q)}
                onOpenNotes={() => setNotesQuestionId(q.id)}
                noteSaved={noteVersion >= 0 && hasNote(attemptId, q.id)}
                priority={qi === 0}
              />
            );
          })}

          <div className="rounded-xl border border-info/20 bg-info-soft p-3.5 text-xs text-[var(--color-text)] sm:flex sm:items-center sm:justify-between">
            <p>You are in Test Mode — you will see results and explanations after you submit the test.</p>
            <button type="button" onClick={() => setReviewOpen(true)} className="mt-2 flex-none text-xs font-bold text-brand-red underline sm:mt-0">
              End Test
            </button>
          </div>
        </div>

        <aside className="hidden md:block">
          <TestProgressPanel answeredCount={answeredCount} totalQuestions={attempt.questions.length} remaining={remaining} currentQuestion={currentQuestion} />
        </aside>
      </div>

      <div className="border-t border-[var(--color-border)] bg-white">
        <div className="hm-page flex items-center gap-2 !py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-semibold disabled:opacity-40 sm:flex-none sm:px-8"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="hidden flex-none items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] sm:flex"
          >
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> {answeredCount} answered
          </button>
          {page < totalPages - 1 ? (
            <button onClick={() => setPage((p) => p + 1)} className="flex-1 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white sm:flex-none sm:px-8">
              Next →
            </button>
          ) : (
            <button
              onClick={() => setReviewOpen(true)}
              className="flex-1 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white sm:flex-none sm:px-8"
            >
              Review & Submit →
            </button>
          )}
        </div>
      </div>

      <Drawer open={navigatorOpen} onClose={() => setNavigatorOpen(false)} title={`Questions · ${answeredCount} / ${attempt.questions.length}`}>
        <QuestionNavigatorPanel
          questions={attempt.questions}
          answers={answers}
          marked={marked}
          currentQuestionId={currentQuestion?.id}
          onJump={goToQuestion}
          answeredCount={answeredCount}
          compact
        />
      </Drawer>

      <ReviewAnswersModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        questions={attempt.questions}
        answers={answers}
        marked={marked}
        onJump={goToQuestion}
        onConfirmSubmit={submitTest}
        submitting={submitting}
      />

      <NotesPopover
        attemptId={attemptId}
        questionId={notesQuestionId}
        open={notesQuestionId != null}
        onClose={() => {
          setNotesQuestionId(null);
          setNoteVersion((v) => v + 1);
        }}
      />
    </div>
  );
}

export default function AttemptPage() {
  return (
    <RequireAuth>
      <AttemptContent />
    </RequireAuth>
  );
}
