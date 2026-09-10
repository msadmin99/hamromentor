"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

/**
 * Grand Test 3.0 — student series analytics.
 *
 * Consumes GET /api/tests/grand-series/ (grand_test_series_summary).
 * Every number here is computed server-side per GT3-6's approved rules:
 * a MISSED test is never counted as a zero-score exam, the average and
 * trend use completed tests only, and attendance is completed /
 * (completed + missed). This page only formats what the backend returns.
 */

const TREND_COPY = {
  improving: { label: "Improving", tone: "text-brand-green", note: "Your Grand Test scores are trending upward." },
  declining: { label: "Needs attention", tone: "text-brand-red", note: "Your recent Grand Test scores have dropped — focus on weak areas before the next one." },
  stable: { label: "Stable", tone: "text-brand-blue", note: "Your Grand Test scores are holding steady." },
  variable: { label: "Variable", tone: "text-amber-700", note: "Your Grand Test scores have been up and down — consistency is the next gain." },
  insufficient_data: { label: "Not enough data yet", tone: "text-[var(--color-text-muted)]", note: "Complete at least two Grand Tests to see a trend." },
};

const STATUS_META = {
  completed: { label: "Completed", cls: "bg-brand-green-light text-brand-green" },
  missed: { label: "Missed", cls: "bg-brand-red-light text-brand-red" },
  upcoming: { label: "Upcoming", cls: "bg-brand-blue/10 text-brand-blue" },
  live: { label: "Live", cls: "bg-warning-soft text-amber-700" },
  in_progress: { label: "In progress", cls: "bg-warning-soft text-amber-700" },
  not_scheduled: { label: "Not scheduled", cls: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" },
};

function fmtDate(v) {
  if (!v) return null;
  return new Date(v).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-center">
      <p className="text-2xl font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

function SeriesContent() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  // State only changes inside .then()/.catch() — no synchronous reset in
  // the body — so this stays safe to call straight from an effect and on
  // Retry, matching the pattern the tests/[id] and result pages use.
  function load() {
    api
      .get("/tests/grand-series/")
      .then((d) => {
        setData(d);
        setErr(false);
      })
      .catch(() => setErr(true));
  }
  useEffect(load, []);

  if (err) {
    return (
      <AppShell>
        <Header title="Grand Test Series" showBack />
        <div className="hm-page-narrow">
          <ErrorCard title="Unable to load your Grand Test series." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <Header title="Grand Test Series" showBack />
        <div className="hm-page-narrow flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
          <div className="h-40 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
        </div>
      </AppShell>
    );
  }

  const pct = (v) => (v == null ? "—" : `${v}%`);
  const trend = TREND_COPY[data.trend] || TREND_COPY.insufficient_data;
  const tests = data.tests || [];

  return (
    <AppShell>
      <Header title="Grand Test Series" showBack />
      <div className="hm-page mx-auto flex max-w-[900px] flex-col gap-4">
        {tests.length === 0 ? (
          <div className="hm-card p-6 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">You don&apos;t have any Grand Tests yet.</p>
            <Link href="/grand-test" className="mt-3 inline-block text-sm font-bold text-brand-blue">
              Browse Grand Tests →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat value={data.completed_count ?? 0} label="Completed" />
              <Stat value={data.missed_count ?? 0} label="Missed" />
              <Stat value={data.upcoming_count ?? 0} label="Upcoming" />
              <Stat value={data.attendance_percentage == null ? "—" : `${data.attendance_percentage}%`} label="Attendance" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat value={pct(data.average_score_percentage)} label="Average score" />
              <Stat value={pct(data.best_score_percentage)} label="Personal best" />
              <Stat value={pct(data.latest_score_percentage)} label="Latest score" />
            </div>

            <div className="hm-card p-4">
              <p className="text-sm font-bold text-[var(--color-text)]">
                Score trend: <span className={trend.tone}>{trend.label}</span>
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{trend.note}</p>
              <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                Missed Grand Tests are never counted as a zero — the average and trend use completed tests only.
              </p>
            </div>

            <div className="hm-card overflow-hidden p-0">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="text-sm font-bold text-[var(--color-text)]">All your Grand Tests</p>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {tests.map((t) => {
                  const meta = STATUS_META[t.status] || STATUS_META.not_scheduled;
                  return (
                    <li key={t.test_id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <Link href={`/tests/${t.test_id}`} className="block truncate text-sm font-semibold text-[var(--color-text)] hover:text-brand-blue">
                          {t.test_title}
                        </Link>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{fmtDate(t.scheduled_start) || "No date set"}</p>
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        {t.status === "completed" && t.score_percentage != null && (
                          <span className="text-sm font-extrabold text-[var(--color-text)]">{t.score_percentage}%</span>
                        )}
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function GrandTestSeriesPage() {
  return (
    <RequireAuth>
      <SeriesContent />
    </RequireAuth>
  );
}
