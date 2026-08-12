"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function AttemptContent() {
  const { attemptId } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [remaining, setRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.get(`/attempts/${attemptId}/`).then((data) => {
      if (data.status === "submitted") {
        router.replace(`/tests/result/${attemptId}`);
        return;
      }
      setAttempt(data);
      const totalSeconds = data.duration_minutes * 60;
      const elapsed = (Date.now() - new Date(data.start_time).getTime()) / 1000;
      setRemaining(totalSeconds - elapsed);
    });
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

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0) {
      submitTest();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining != null]);

  // How many questions render together on one page — admin-configured per
  // test (Test.questions_per_page). Defaults to 1, which makes pageQuestions
  // a single-element array and reproduces the original one-question-at-a-time
  // behavior exactly, rather than needing a separate code path.
  const perPage = Math.max(1, attempt?.questions_per_page || 1);
  const totalPages = attempt ? Math.max(1, Math.ceil(attempt.questions.length / perPage)) : 1;
  const pageQuestions = attempt ? attempt.questions.slice(page * perPage, (page + 1) * perPage) : [];
  const pageStart = page * perPage + 1;
  const pageEnd = attempt ? Math.min((page + 1) * perPage, attempt.questions.length) : 0;

  async function selectOption(question, optionId) {
    setAnswers((a) => ({ ...a, [question.id]: optionId }));
    try {
      await api.post(`/attempts/${attemptId}/answer/`, {
        question_id: question.id,
        option_id: optionId,
        mark_for_review: !!marked[question.id],
      });
    } catch {
      // best-effort; final state reconciled at submit time isn't possible for unsent answers,
      // so we keep local state as the source of truth for the UI.
    }
  }

  function toggleMark(question) {
    setMarked((m) => ({ ...m, [question.id]: !m[question.id] }));
  }

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (!attempt) {
    return <div className="p-6 text-sm text-[var(--color-text-muted)]">Loading test…</div>;
  }

  return (
    <div className="hm-app-shell">
      <header className="hm-header-gradient sticky top-0 z-20 text-white">
        <div className="hm-page">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{attempt.test_title}</span>
            <span className="rounded-md bg-black/20 px-2 py-1 font-mono text-xs">{formatTime(remaining)}</span>
          </div>
          <p className="mt-1 text-xs text-white/85">
            {perPage === 1
              ? `Question ${pageStart} of ${attempt.questions.length}`
              : `Page ${page + 1} of ${totalPages} (Q${pageStart}–Q${pageEnd} of ${attempt.questions.length})`}{" "}
            · {answeredCount} answered
          </p>
        </div>
      </header>

      <div className="hm-page flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {pageQuestions.map((q, qi) => {
            const globalIndex = page * perPage + qi;
            return (
              <div key={q.id} className={pageQuestions.length > 1 ? "hm-card p-4" : ""}>
                {pageQuestions.length > 1 && (
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Q{globalIndex + 1}
                  </p>
                )}
                <div className="text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
                  <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} priority={qi === 0} />
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  {q.options.map((opt, i) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => selectOption(q, opt.id)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm ${
                          selected ? "border-brand-blue bg-blue-50" : "border-[var(--color-border)]"
                        }`}
                      >
                        <div className="flex gap-1.5 text-[var(--color-text)]">
                          <span className="flex-none font-semibold">{String.fromCharCode(65 + i)})</span>
                          <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} className="min-w-0 flex-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => toggleMark(q)}
                  className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    marked[q.id] ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {marked[q.id] ? "★ Marked for review" : "☆ Mark for review"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-8 gap-2 sm:grid-cols-10">
          {attempt.questions.map((q, i) => {
            const state = answers[q.id] ? "answered" : marked[q.id] ? "marked" : "unanswered";
            const stateClasses = {
              answered: "bg-brand-blue text-white",
              marked: "bg-yellow-400 text-white",
              unanswered: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
            }[state];
            const questionPage = Math.floor(i / perPage);
            return (
              <button
                key={q.id}
                onClick={() => setPage(questionPage)}
                className={`aspect-square rounded-md text-xs font-semibold ${stateClasses} ${
                  questionPage === page ? "ring-2 ring-brand-blue ring-offset-1" : ""
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] bg-white">
        <div className="hm-page flex items-center gap-2 !py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          {page < totalPages - 1 ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="flex-1 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitTest}
              disabled={submitting}
              className="flex-1 rounded-xl bg-brand-red py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit test"}
            </button>
          )}
        </div>
      </div>
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
