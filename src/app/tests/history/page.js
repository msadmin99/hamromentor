"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function formatDuration(seconds) {
  if (seconds == null) return null;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get("test");
  const sessionId = searchParams.get("session");
  const [attempts, setAttempts] = useState(null);

  useEffect(() => {
    api.get("/attempts/mine/").then(setAttempts);
  }, []);

  const completed = useMemo(() => {
    if (!attempts) return [];
    let list = attempts.filter((a) => a.status === "submitted");
    // Sessions are never merged — filtering by ?session= shows only that one
    // scheduled occurrence's attempts, separate from every other session of
    // the same exam (which each have their own ?session= value).
    if (sessionId) list = list.filter((a) => String(a.session) === String(sessionId));
    else if (testId) list = list.filter((a) => String(a.test) === String(testId));
    return list;
  }, [attempts, testId, sessionId]);

  return (
    <AppShell>
      <Header title="My Attempts" showBack />
      <div className="hm-page-narrow flex flex-col gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          Every exam you&apos;ve submitted stays here — reopen any of them to review your answers and solutions.
        </p>

        {attempts === null && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        {attempts !== null && completed.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No submitted exams yet.</p>
        )}

        {completed.map((a) => (
          <Link key={a.id} href={`/tests/result/${a.id}`} className="hm-card flex items-center justify-between p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{a.test_title}</p>
                {a.exam_type && (
                  <span className="flex-none rounded-md bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                    {a.exam_type}
                  </span>
                )}
                {a.session_name && (
                  <span className="flex-none rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue">
                    {a.session_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {a.start_time && new Date(a.start_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                Score {a.score}/{a.total_marks}
                {a.accuracy != null && ` · ${a.accuracy}% accuracy`}
                {a.percentile != null && ` · ${a.percentile}th percentile`}
                {formatDuration(a.time_taken_seconds) && ` · ${formatDuration(a.time_taken_seconds)}`}
              </p>
            </div>
            <span className="flex-none text-[var(--color-text-muted)]">›</span>
          </Link>
        ))}
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
