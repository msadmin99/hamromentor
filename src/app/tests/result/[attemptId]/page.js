"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { CheckCircleIcon, WarningTriangleIcon } from "@/components/icons";
import OptionResultBar from "@/components/OptionResultBar";
import PerformanceMessage from "@/components/PerformanceMessage";
import ReferenceCard from "@/components/ReferenceCard";
import ReferencesList from "@/components/ReferencesList";
import ReportQuestionButton from "@/components/ReportQuestionModal";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import SmartPracticeCard from "@/components/smart-practice/SmartPracticeCard";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

// Phase D, Area 6: TestResultSerializer (tests_app/serializers.py) returns
// exactly id/test/test_title/score/total_marks/rank/percentile/accuracy/
// status/auto_submitted/start_time/end_time/questions/session/session_name/
// can_view_solutions/can_view_rank — no explicit correct/incorrect/skipped
// COUNT fields, no time-per-question, no subject/chapter/topic aggregate.
// Correct/Incorrect/Skipped below are a real tally of each question's own
// is_correct/selected_option_id (already authoritative per-question truth
// this endpoint returns) — the same category of derivation the original
// page's own `counts` already did for its filter-tab badges, not an
// alternative score. Time Taken is end_time - start_time, both real
// timestamps. Subject/Chapter/Topic performance is deliberately NOT
// built here: this endpoint has no authoritative per-subject aggregate,
// and computing one client-side would require guessing at a methodology
// (attempted-vs-total denominator, negative-marking treatment) that could
// disagree with the server's own `accuracy` — the exact "fake subject
// analytics" the brief warns against, so it's omitted rather than guessed.

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "correct", label: "Correct" },
  { key: "wrong", label: "Wrong" },
  { key: "skipped", label: "Skipped" },
];

/** Visible All/Correct/Wrong/Skipped tabs, same pill style as testpage/
 * StatusTabs. */
function AnswerFilterTabs({ filter, counts, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by answer">
      {FILTER_TABS.map((t) => {
        const active = filter === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-brand-blue text-white" : "bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {t.label} <span className={active ? "text-white/80" : "text-[var(--color-text-muted)]"}>({counts[t.key]})</span>
          </button>
        );
      })}
    </div>
  );
}

function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function MetricCard({ value, label, tone }) {
  const toneClass =
    tone === "success" ? "text-brand-green" : tone === "danger" ? "text-brand-red" : tone === "warning" ? "text-amber-700" : "text-[var(--color-text)]";
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-center">
      <p className={`text-2xl font-extrabold ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

function ResultContent() {
  const { attemptId } = useParams();
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);
  const [errorKind, setErrorKind] = useState(null); // 'notfound' | 'notsubmitted' | 'error' | null
  const [errorMessage, setErrorMessage] = useState("");
  const [prevAttempt, setPrevAttempt] = useState(null); // enrichment only — never blocks the page

  function load() {
    api
      .get(`/attempts/${attemptId}/result/`)
      .then((data) => {
        setResult(data);
        setErrorKind(null);
        // Real previous-attempt comparison, from the same already-used
        // /attempts/mine/ endpoint (Area 2/Area 5) — only rendered when a
        // genuinely earlier submitted attempt of this same test exists.
        api
          .get("/attempts/mine/")
          .then((attempts) => {
            const earlier = attempts
              .filter((a) => a.test === data.test && a.id !== data.id && a.status === "submitted")
              .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
            if (earlier[0]) setPrevAttempt(earlier[0]);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (err.status === 404) setErrorKind("notfound");
        else if (err.status === 403) {
          setErrorKind("notsubmitted");
          setErrorMessage(err.message);
        } else {
          setErrorKind("error");
        }
      });
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // Phase 7: while solutions are locked (Test.solutions_visibility='manual'
  // pending release, or 'auto' pending the exam window closing), the
  // backend omits is_correct/explanation entirely rather than sending a
  // value that could be misread as "every question was wrong" — mirrored
  // here by falling back to an unfiltered, un-scored view instead of
  // guessing from an absent field.
  const solutionsLocked = !!result && result.can_view_solutions === false;

  const counts = useMemo(() => {
    if (!result) return { all: 0, correct: 0, wrong: 0, skipped: 0 };
    const all = result.questions.length;
    if (solutionsLocked) return { all, correct: 0, wrong: 0, skipped: 0 };
    const skipped = result.questions.filter((q) => q.selected_option_id == null).length;
    const correct = result.questions.filter((q) => q.is_correct).length;
    return { all, correct, wrong: all - correct - skipped, skipped };
  }, [result, solutionsLocked]);

  const visibleQuestions = useMemo(() => {
    if (!result) return [];
    if (solutionsLocked) return result.questions;
    if (filter === "correct") return result.questions.filter((q) => q.is_correct);
    if (filter === "wrong") return result.questions.filter((q) => !q.is_correct && q.selected_option_id != null);
    if (filter === "skipped") return result.questions.filter((q) => q.selected_option_id == null);
    return result.questions;
  }, [result, filter, solutionsLocked]);

  const timeTakenSeconds =
    result?.start_time && result?.end_time ? Math.max(0, Math.round((new Date(result.end_time) - new Date(result.start_time)) / 1000)) : null;

  if (errorKind === "notfound") {
    return (
      <AppShell>
        <Header title="Result" showBack />
        <div className="hm-page-narrow py-6">
          <div className="hm-card p-8 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Result not available.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Please check your test history.</p>
            <Link href="/tests/history" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Test History →
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (errorKind === "notsubmitted") {
    return (
      <AppShell>
        <Header title="Result" showBack />
        <div className="hm-page-narrow py-6">
          <div className="hm-card p-8 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Your result is being prepared.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {errorMessage || "This attempt hasn't been submitted yet."}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (errorKind === "error") {
    return (
      <AppShell>
        <Header title="Result" showBack />
        <div className="hm-page-narrow py-6">
          <ErrorCard title="Unable to load your result." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell>
        <Header title="Result" showBack />
        <div className="hm-page-narrow flex flex-col gap-3 py-4">
          <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="mx-auto h-3 w-32 rounded bg-[var(--color-surface-muted)]" />
            <div className="mx-auto mt-3 h-8 w-24 rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
        </div>
      </AppShell>
    );
  }

  const accuracyTone = result.accuracy >= 75 ? "success" : result.accuracy >= 40 ? "warning" : "danger";

  return (
    <AppShell>
      <Header title="Result" showBack />

      <div className="hm-page-narrow flex flex-col gap-4 pb-2">
        {/* 1. Result Hero + 2. Primary Score */}
        <div className="hm-card p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {result.test_title || "Test Completed"}
          </p>
          <p className="mt-3 text-4xl font-extrabold leading-none text-[var(--color-text)]">
            {result.score}
            <span className="text-lg font-semibold text-[var(--color-text-muted)]"> / {result.total_marks}</span>
          </p>
          <p className={`mt-2 text-sm font-bold ${accuracyTone === "success" ? "text-brand-green" : accuracyTone === "warning" ? "text-amber-700" : "text-brand-red"}`}>
            {result.accuracy}% Accuracy
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <CheckCircleIcon className="h-3.5 w-3.5 text-brand-green" />
            {/* 3. Result status — the actual backend state, never an
                invented Pass/Fail this platform has no such concept for. */}
            {result.auto_submitted ? "Auto-submitted" : "Submitted"}
            {formatDate(result.end_time) && ` · ${formatDate(result.end_time)}`}
          </p>
        </div>

        {/* 4. Key metrics — only real fields/tallies. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {!solutionsLocked && (
            <>
              <MetricCard value={counts.correct} label="Correct" tone="success" />
              <MetricCard value={counts.wrong} label="Incorrect" tone="danger" />
              <MetricCard value={counts.skipped} label="Skipped" tone="warning" />
            </>
          )}
          {timeTakenSeconds != null && <MetricCard value={formatDuration(timeTakenSeconds)} label="Time Taken" />}
          {result.can_view_rank && result.rank != null && <MetricCard value={`#${result.rank}`} label="Rank" />}
          {result.can_view_rank && result.percentile != null && <MetricCard value={`${result.percentile}%`} label="Percentile" />}
        </div>

        {/* Comparison — only when a real earlier submitted attempt of this
            same test exists. */}
        {prevAttempt && prevAttempt.accuracy != null && result.accuracy != null && (
          <div className="hm-card flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Accuracy vs. last attempt</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {prevAttempt.accuracy}% → {result.accuracy}%
              </p>
            </div>
            {(() => {
              const delta = Math.round((result.accuracy - prevAttempt.accuracy) * 10) / 10;
              const improved = delta > 0;
              return (
                <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${improved ? "bg-brand-green-light text-brand-green" : delta < 0 ? "bg-brand-red-light text-brand-red" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}>
                  {improved ? "+" : ""}{delta}%
                </span>
              );
            })()}
          </div>
        )}

        {solutionsLocked ? (
          <div className="rounded-xl border border-info/20 bg-info-soft p-3 text-sm text-[var(--color-text)]">
            Solutions for this exam aren&apos;t available yet — your score above is final, and the correct answers
            and explanations will appear here once they&apos;re released.
          </div>
        ) : (
          <>
            {/* 9 & 10. Mistakes bridge + recommended next actions — only
                real, already-existing routes; no fabricated recommendation
                copy beyond what this attempt's own counts justify. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {counts.wrong > 0 && (
                <div className="hm-card p-4">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
                    <WarningTriangleIcon className="h-4 w-4 flex-none text-brand-red" /> You missed {counts.wrong} question{counts.wrong === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Revisit questions you&apos;ve gotten wrong — from this test and others.
                  </p>
                  <Link href="/qbank/mistakes" className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-brand-blue text-sm font-bold text-brand-blue">
                    Review Mistakes →
                  </Link>
                </div>
              )}
              <div className="hm-card p-4">
                <p className="text-sm font-bold text-[var(--color-text)]">Ready for another round?</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Review your mistakes above, then head back to this test&apos;s page when you&apos;re ready.
                </p>
                <Link href={`/tests/${result.test}`} className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl bg-brand-blue text-sm font-bold text-white">
                  View Test →
                </Link>
              </div>
            </div>

            <AnswerFilterTabs filter={filter} counts={counts} onChange={setFilter} />
          </>
        )}

        <SmartPracticeCard sourceTestId={result.test} />

        {/* 8. Question review — unchanged internals, only re-hosted under
            the new hierarchy above. */}
        <div className="flex flex-col gap-3">
          {visibleQuestions.map((q, i) => (
            <div key={q.id ?? `deleted-${i}`} className="hm-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                  <span className="mr-1.5 text-[var(--color-text-muted)]">{i + 1}.</span>
                  <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} />
                </div>
                <div className="flex flex-none items-center gap-2">
                  {q.solutions_locked ? (
                    <span className="flex-none rounded-md bg-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-muted)]">
                      LOCKED
                    </span>
                  ) : q.selected_option_id == null ? (
                    <span className="flex-none rounded-md bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      SKIPPED
                    </span>
                  ) : (
                    <span
                      className={`flex-none rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        q.is_correct ? "bg-brand-green-light text-brand-green" : "bg-brand-red-light text-brand-red"
                      }`}
                    >
                      {q.is_correct ? "CORRECT" : "WRONG"}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = q.selected_option_id === opt.id;
                  // Locked: show only which option was picked, never which
                  // one was right — same "your own answer, not the answer
                  // key" distinction the backend enforces.
                  const state = q.solutions_locked
                    ? isSelected ? "selected" : "neutral"
                    : opt.is_correct ? "correct" : isSelected ? "wrong-selected" : "neutral";
                  let classes = "border-[var(--color-border)]";
                  if (!q.solutions_locked && opt.is_correct) classes = "border-brand-green bg-brand-green-light";
                  else if (isSelected) classes = q.solutions_locked ? "border-brand-blue bg-brand-blue/5" : "border-brand-red bg-brand-red-light";
                  return (
                    <div key={opt.id} className={`rounded-lg border px-3 py-2 text-xs ${classes}`}>
                      {isSelected && <span className="mb-1 block font-semibold text-[var(--color-text)]">(your answer)</span>}
                      <OptionResultBar
                        letter={String.fromCharCode(65 + oi)}
                        option={opt}
                        state={state}
                        percentage={opt.pick_percentage}
                        showStats={!q.solutions_locked && q.stats_available}
                      />
                    </div>
                  );
                })}
              </div>

              {!q.solutions_locked && (
                <>
                  <div className="mt-3">
                    <PerformanceMessage statsAvailable={q.stats_available} correctPercent={q.students_correct_percent} totalResponses={q.total_responses} />
                  </div>

                  <RichContent
                    html={q.explanation}
                    latex={q.explanation_latex}
                    image={q.explanation_image}
                    imageData={q.explanation_image_data}
                    video={q.explanation_video_url}
                    className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]"
                  />

                  {q.options.some((o) => o.explanation && !o.is_correct) && (
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Why the other options are incorrect
                      </p>
                      {q.options.map((opt, oi) =>
                        !opt.explanation || opt.is_correct ? null : (
                          <p key={opt.id} className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                            <span className="font-semibold text-[var(--color-text)]">{String.fromCharCode(65 + oi)}: </span>
                            {opt.explanation}
                          </p>
                        )
                      )}
                    </div>
                  )}

                  <ReferencesList references={q.references} className="mt-3" />

                  {q.key_takeaway && (
                    <div className="mt-3 rounded-xl border border-info/20 bg-info-soft p-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-info">Key Takeaway</p>
                      <p className="text-xs leading-relaxed text-[var(--color-text)]">{q.key_takeaway}</p>
                    </div>
                  )}
                </>
              )}

              <ReferenceCard
                bookName={q.reference_book_name}
                edition={q.reference_edition}
                chapter={q.reference_chapter}
                page={q.reference_page}
                url={q.reference_url}
                className="mt-3"
              />

              {/* Phase 8: q.id can be null for a historical snapshot whose
                  live Question no longer exists — nothing to report against. */}
              {q.id != null && (
                <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                  <ReportQuestionButton questionId={q.id} variant="link" />
                </div>
              )}
            </div>
          ))}
          {visibleQuestions.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No questions in this filter.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function ResultPage() {
  return (
    <RequireAuth>
      <ResultContent />
    </RequireAuth>
  );
}
