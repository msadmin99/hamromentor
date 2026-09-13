"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import AccuracyRing from "@/components/qbank/AccuracyRing";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";
import { themeForKey } from "@/lib/theme";

// QBank 2.0 Phase 4 — Progress & Learning Intelligence.
//
// Deliberately QBank-practice-only: every number here comes from
// /questions/dashboard/ (Overall Performance — already fetched elsewhere,
// nothing new) and the new /questions/progress/ endpoint (subject/topic/
// trend/mastery-distribution — QuestionAttempt/QuestionEvent only, using
// QuestionAttempt.mastery_status throughout). This is NOT the combined
// Test+QBank analytics already on /performance (subject rank, mock-test
// trends, negative marking) — that page is linked to, never duplicated.

const MASTERY_BAR_META = [
  { key: "mastered", label: "Mastered", className: "bg-brand-green" },
  { key: "learning", label: "Learning", className: "bg-info" },
  { key: "need_practice", label: "Need Practice", className: "bg-warning" },
  { key: "weak", label: "Weak", className: "bg-brand-red" },
];

function AccuracySparkline({ trend }) {
  if (!trend?.length) return null;
  const width = 280;
  const height = 64;
  const points = trend.map((row, i) => {
    const x = trend.length > 1 ? (i / (trend.length - 1)) * width : width / 2;
    const y = height - (row.accuracy / 100) * height;
    return { x, y };
  });
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const first = trend[0];
  const last = trend[trend.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Accuracy trend over time">
        {[25, 50, 75].map((pct) => (
          <line key={pct} x1="0" x2={width} y1={height - (pct / 100) * height} y2={height - (pct / 100) * height} stroke="var(--color-border)" strokeWidth="1" />
        ))}
        <polygon points={areaPoints} fill="var(--color-brand-green-light)" />
        <polyline points={linePoints} fill="none" stroke="var(--color-brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{new Date(first.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(last.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function SubjectCard({ row }) {
  const theme = themeForKey(row.subject_slug || row.subject_name);
  return (
    <Link
      href={`/qbank/${row.subject_slug || ""}`}
      className="hm-card flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-extrabold ${theme.iconBg} ${theme.fg}`}>
        {row.accuracy}%
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--color-text)]">{row.subject_name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {row.attempted} attempted · {row.mastered} mastered · {row.weak} weak
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${row.accuracy}%` }} />
        </div>
      </div>
    </Link>
  );
}

function TopicRow({ t, tone, barClassName }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{t.topic_name}</p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {t.subject_name} · {t.attempted} attempted
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${t.accuracy}%` }} />
        </div>
      </div>
      <span className={`flex-none text-sm font-extrabold ${tone}`}>{t.accuracy}%</span>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="hm-card animate-pulse p-5">
      <div className="flex items-center gap-5">
        <div className="h-28 w-28 flex-none rounded-full bg-[var(--color-surface-muted)]" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
        </div>
      </div>
    </div>
  );
}

function ProgressContent() {
  const { activeCourse } = useCourse();
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState(false);
  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setDashboardError(false);
    setProgressError(false);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    Promise.allSettled([
      api.get(`/questions/dashboard/?${params.toString()}`),
      api.get(`/questions/progress/?${params.toString()}`),
    ]).then(([dashRes, progRes]) => {
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      else setDashboardError(true);
      if (progRes.status === "fulfilled") setProgress(progRes.value);
      else setProgressError(true);
      setLoading(false);
    });
  }
  useEffect(load, [activeCourse?.id]);

  const needAttention = dashboard ? (dashboard.weak ?? 0) + (dashboard.need_practice ?? 0) : 0;
  const bySubject = progress?.by_subject || [];
  const weakestTopics = progress?.weakest_topics || [];
  const strongestTopics = progress?.strongest_topics || [];
  const trend = progress?.accuracy_trend || [];
  const dist = progress?.mastery_distribution;
  const distTotal = dist ? dist.mastered + dist.learning + dist.need_practice + dist.weak : 0;

  const bothFailed = dashboardError && progressError;

  return (
    <AppShell>
      <Header title="QBank Progress" showBack courseSwitcher={<CourseSwitcher />} />
      <div className="hm-page-narrow flex flex-col gap-4">
        {bothFailed && (
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">Unable to load your progress.</p>
            <button type="button" onClick={load} className="mt-2 text-xs font-bold text-brand-blue">
              Retry
            </button>
          </div>
        )}

        {loading && <OverviewSkeleton />}

        {!loading && !dashboardError && dashboard && (
          <div className="hm-card p-5">
            <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Overall Performance</p>
            <div className="flex items-center gap-5">
              <AccuracyRing percent={dashboard.attempted > 0 ? Math.round(dashboard.accuracy) : null} label="Accuracy" />
              <div className="flex flex-1 flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Questions Attempted</span>
                  <span className="font-bold text-[var(--color-text)]">{dashboard.attempted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Mastered</span>
                  <span className="font-bold text-brand-green">{dashboard.mastered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Need Attention</span>
                  <span className="font-bold text-brand-red">{needAttention}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !progressError && trend.length > 1 && (
          <div className="hm-card p-4">
            <p className="mb-1 text-sm font-bold text-[var(--color-text)]">Accuracy Trend</p>
            <p className="mb-2 text-[11px] text-[var(--color-text-muted)]">Last 90 days of QBank practice</p>
            <AccuracySparkline trend={trend} />
          </div>
        )}

        {!loading && !progressError && dist && distTotal > 0 && (
          <div className="hm-card p-4">
            <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Mastery Distribution</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {MASTERY_BAR_META.map((m) => {
                const pct = (dist[m.key] / distTotal) * 100;
                return pct > 0 ? <div key={m.key} className={m.className} style={{ width: `${pct}%` }} title={`${m.label}: ${dist[m.key]}`} /> : null;
              })}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
              {MASTERY_BAR_META.map((m) => (
                <span key={m.key} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${m.className}`} aria-hidden="true" />
                  {m.label} ({dist[m.key]})
                </span>
              ))}
            </div>
          </div>
        )}

        {!loading && !progressError && bySubject.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Subject Performance</p>
            <div className="flex flex-col gap-2">
              {bySubject.map((row) => (
                <SubjectCard key={row.subject_id} row={row} />
              ))}
            </div>
          </div>
        )}

        {!loading && !progressError && weakestTopics.length > 0 && (
          <div className="hm-card p-4">
            <p className="mb-1 text-sm font-bold text-[var(--color-text)]">Weakest Topics</p>
            <p className="mb-2 text-[11px] text-[var(--color-text-muted)]">Topics with enough attempts for a reliable accuracy</p>
            <div className="divide-y divide-[var(--color-border)]">
              {weakestTopics.map((t) => (
                <TopicRow key={t.topic_id} t={t} tone="text-brand-red" barClassName="bg-brand-red" />
              ))}
            </div>
          </div>
        )}

        {!loading && !progressError && strongestTopics.length > 0 && (
          <div className="hm-card p-4">
            <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Strongest Topics</p>
            <div className="divide-y divide-[var(--color-border)]">
              {strongestTopics.map((t) => (
                <TopicRow key={t.topic_id} t={t} tone="text-brand-green" barClassName="bg-brand-green" />
              ))}
            </div>
          </div>
        )}

        {!loading && !progressError && !dashboardError && bySubject.length === 0 && trend.length === 0 && (
          <div className="hm-card p-8 text-center">
            <p className="text-2xl">📊</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Not enough data yet</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Practice a few questions and your progress will start showing up here.
            </p>
            <Link href="/qbank" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Start Practicing →
            </Link>
          </div>
        )}

        {weakestTopics[0] && (
          <div className="hm-card !border-info-soft !bg-info-soft p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-info">Recommended Focus</p>
            <p className="text-sm font-bold text-[var(--color-text)]">{weakestTopics[0].topic_name}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Based on {weakestTopics[0].attempted} recent attempts with {weakestTopics[0].accuracy}% accuracy.
            </p>
            <Link
              href={`/qbank/practice?topic=${weakestTopics[0].topic_id}&auto=1`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
            >
              Practice Now →
            </Link>
          </div>
        )}

        <Link href="/performance" className="text-center text-xs font-bold text-brand-blue">
          View combined Test + QBank analytics →
        </Link>
      </div>
    </AppShell>
  );
}

export default function ProgressPage() {
  return (
    <RequireAuth>
      <ProgressContent />
    </RequireAuth>
  );
}
