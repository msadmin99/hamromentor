"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { ClockIcon, RankIcon, TestsIcon } from "@/components/icons";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

// Phase D, Area 2: same /attempts/mine/ endpoint (TestAttemptSummarySerializer
// — tests_app/serializers.py), same fields as before. That serializer does
// NOT include per-question correct/incorrect/skipped counts (only the full
// TestResultSerializer used by a single result page does, which would mean
// N+1 nested data on a list of every attempt) — so this page does not show
// those columns; showing them would mean fabricating data. Only two real
// statuses exist on TestAttempt.STATUS_CHOICES (in_progress, submitted) — no
// "abandoned" state exists in this data model, so none is invented here.
// No pagination exists on this endpoint today (it returns the full list,
// ordered by -start_time) — none is added on the frontend either; the
// exam-type filter below is a pure client-side filter over that same
// already-loaded list, which is fine at realistic per-student attempt
// counts and adds no new request.
const TYPE_LABELS = { daily: "Daily Test", mock: "Mock Test", grand: "Grand Test", pyq: "Past Year Questions" };

function formatDuration(seconds) {
  if (seconds == null) return null;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function SkeletonRow() {
  return (
    <div className="hm-card flex animate-pulse items-center justify-between p-4">
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-40 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-3 w-56 rounded bg-[var(--color-surface-muted)]" />
      </div>
      <div className="h-8 w-8 flex-none rounded-full bg-[var(--color-surface-muted)]" />
    </div>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get("test");
  const sessionId = searchParams.get("session");
  const [attempts, setAttempts] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  function load() {
    setAttempts(null);
    setError(false);
    api
      .get("/attempts/mine/")
      .then(setAttempts)
      .catch(() => {
        // Previously left `attempts` at null forever on a failed fetch,
        // so the skeleton kept rendering underneath the error message
        // instead of being replaced by it. Same fix as bookmarks/page.js.
        setAttempts([]);
        setError(true);
      });
  }
  useEffect(() => {
    load();
  }, []);

  const scoped = useMemo(() => {
    if (!attempts) return [];
    let list = attempts;
    // Sessions are never merged — filtering by ?session= shows only that one
    // scheduled occurrence's attempts, separate from every other session of
    // the same exam (which each have their own ?session= value).
    if (sessionId) list = list.filter((a) => String(a.session) === String(sessionId));
    else if (testId) list = list.filter((a) => String(a.test) === String(testId));
    return list;
  }, [attempts, testId, sessionId]);

  const availableTypes = useMemo(
    () => [...new Set(scoped.map((a) => a.exam_type).filter(Boolean))],
    [scoped]
  );

  const filtered = useMemo(
    () => (typeFilter ? scoped.filter((a) => a.exam_type === typeFilter) : scoped),
    [scoped, typeFilter]
  );

  const submittedCount = scoped.filter((a) => a.status === "submitted").length;

  return (
    <AppShell>
      <Header
        title="Test History"
        subtitle={attempts !== null ? `${scoped.length} attempt${scoped.length === 1 ? "" : "s"}` : undefined}
        showBack
      />
      <div className="hm-page-narrow flex flex-col gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          Review your previous attempts and track your progress — reopen any completed exam to review your answers
          and solutions.
        </p>

        {attempts === null && (
          <div className="flex flex-col gap-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {error && (
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">Unable to load test history.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Please try again.</p>
            <button type="button" onClick={load} className="mt-2 text-xs font-bold text-brand-blue">
              Retry
            </button>
          </div>
        )}

        {!error && attempts !== null && scoped.length === 0 && (
          <div className="hm-card p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <TestsIcon />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">Your test history starts here.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Complete your first test to see your scores, accuracy and detailed analysis.
            </p>
            <Link href="/exams" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Browse Tests →
            </Link>
          </div>
        )}

        {!error && scoped.length > 0 && availableTypes.length > 1 && (
          <div className="hm-scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setTypeFilter("")}
              className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                typeFilter === "" ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              All
            </button>
            {availableTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
                aria-pressed={typeFilter === t}
                className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  typeFilter === t ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        )}

        {!error && filtered.map((a) => {
          const inProgress = a.status === "in_progress";
          const duration = formatDuration(a.time_taken_seconds);
          return (
            <div key={a.id} className="hm-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">{a.test_title}</p>
                    {a.exam_type && (
                      <span className="flex-none rounded-md bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                        {TYPE_LABELS[a.exam_type] || a.exam_type}
                      </span>
                    )}
                    {a.session_name && (
                      <span className="flex-none rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue">
                        {a.session_name}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {inProgress ? "Started" : "Submitted"} {formatDate(a.start_time)}
                    {a.auto_submitted && " · Auto-submitted"}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    inProgress ? "bg-warning-soft text-amber-700" : "bg-info-soft text-info"
                  }`}
                >
                  {inProgress ? "In Progress" : "Submitted"}
                </span>
              </div>

              {inProgress ? (
                <Link
                  href={`/tests/attempt/${a.id}`}
                  className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-blue text-sm font-bold text-white transition hover:brightness-110"
                >
                  Continue →
                </Link>
              ) : (
                <>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                    <div>
                      <p className="text-2xl font-extrabold leading-none text-[var(--color-text)]">
                        {a.score}
                        <span className="text-sm font-semibold text-[var(--color-text-muted)]"> / {a.total_marks}</span>
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Score</p>
                    </div>
                    {a.accuracy != null && (
                      <div className="text-right">
                        <p className="text-2xl font-extrabold leading-none text-brand-blue">{a.accuracy}%</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Accuracy</p>
                      </div>
                    )}
                  </div>

                  {(duration || a.rank != null || a.percentile != null) && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
                      {duration && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" /> {duration}
                        </span>
                      )}
                      {(a.rank != null || a.percentile != null) && (
                        <span className="flex items-center gap-1">
                          <RankIcon className="h-3.5 w-3.5" />
                          {a.rank != null && `Rank #${a.rank}`}
                          {a.rank != null && a.percentile != null && " · "}
                          {a.percentile != null && `${a.percentile}th percentile`}
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/tests/result/${a.id}`}
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand-blue text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5"
                  >
                    View Analysis →
                  </Link>
                </>
              )}
            </div>
          );
        })}

        {!error && attempts !== null && scoped.length > 0 && submittedCount === 0 && filtered.length > 0 && typeFilter === "" && (
          <p className="text-center text-[11px] text-[var(--color-text-muted)]">
            No submitted exams yet — finish an in-progress attempt above to see it here.
          </p>
        )}
      </div>
    </AppShell>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}
