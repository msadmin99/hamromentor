"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { MASTERY_META, SkeletonCard, stripHtml } from "@/components/qbank/revisionListShared";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// QBank 2.0 Phase 3A/3B — the Revision Center. Every number on this page
// comes straight from GET /questions/dashboard/ (already course-scoped,
// already computing due_today/overdue/weak/repeated_mistakes/
// recent_mistakes/revision_accuracy/daily_activity — see academics/
// views.py's dashboard() action) and each category's own list is the
// existing paginated GET /questions/browse/?status=... — no new
// endpoints, no second mastery/revision system.
const CATEGORIES = [
  { key: "overdue", label: "Overdue", icon: "⏰", statKey: "overdue", accent: "bg-brand-red-light text-brand-red" },
  { key: "due_today", label: "Due Today", icon: "📅", statKey: "due_today", accent: "bg-info-soft text-info" },
  { key: "weak", label: "Weak", icon: "🔴", statKey: "weak", accent: "bg-brand-red-light text-brand-red" },
  { key: "recent_mistake", label: "Recent Mistakes", icon: "❌", statKey: "recent_mistakes", accent: "bg-warning-soft text-amber-700" },
  { key: "repeated_mistake", label: "Repeated Mistakes", icon: "🔁", statKey: "repeated_mistakes", accent: "bg-violet-100 text-violet-600" },
];

const TIME_OPTIONS = [5, 10, 20, 30];

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="hm-card animate-pulse p-3.5">
          <div className="h-6 w-10 rounded bg-[var(--color-surface-muted)]" />
          <div className="mt-2 h-3 w-16 rounded bg-[var(--color-surface-muted)]" />
        </div>
      ))}
    </div>
  );
}

function RevisionCenterContent() {
  const { activeCourse } = useCourse();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryQuestions, setCategoryQuestions] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  const [minutes, setMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState("");
  const isCustom = !TIME_OPTIONS.includes(minutes);

  function loadStats() {
    setStatsLoading(true);
    setStatsError(false);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/dashboard/?${params.toString()}`)
      .then(setStats)
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }
  useEffect(loadStats, [activeCourse?.id]);

  function loadCategory(key) {
    setCategoryLoading(true);
    setCategoryError(false);
    const params = new URLSearchParams({ status: key, page_size: "20" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/browse/?${params.toString()}`)
      .then((data) => setCategoryQuestions(data?.results || []))
      .catch(() => setCategoryError(true))
      .finally(() => setCategoryLoading(false));
  }

  function selectCategory(key) {
    setActiveCategory((prev) => (prev === key ? null : key));
    if (key !== activeCategory) loadCategory(key);
  }

  const dueToday = stats?.due_today ?? 0;
  const overdue = stats?.overdue ?? 0;
  const totalDue = dueToday + overdue;
  const estimatedMinutes = totalDue; // ~1 question/minute — same heuristic QuickPractice already uses
  const allCaughtUp = !statsLoading && !statsError && totalDue === 0;

  const visibleCategories = CATEGORIES.filter((c) => (stats?.[c.statKey] ?? 0) > 0);

  function startSmartRevision() {
    const m = isCustom ? Number(customMinutes) || 10 : minutes;
    router.push(`/qbank/practice?smart_revision=1&time=${m}&count=${m}&auto=1`);
  }

  return (
    <AppShell>
      <Header title="Revision Center" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        {statsError && (
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">Unable to load your revisions.</p>
            <button type="button" onClick={loadStats} className="mt-2 text-xs font-bold text-brand-blue">
              Retry
            </button>
          </div>
        )}

        {statsLoading && (
          <>
            <div className="hm-card animate-pulse p-5">
              <div className="h-4 w-32 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-3 h-8 w-24 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-4 h-11 w-full rounded-xl bg-[var(--color-surface-muted)]" />
            </div>
            <SummarySkeleton />
          </>
        )}

        {!statsLoading && !statsError && allCaughtUp && (
          <div className="hm-card p-8 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2 text-base font-bold text-[var(--color-text)]">Nothing due today</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">You are completely caught up.</p>
            <Link
              href="/qbank/practice?status=weak&auto=1"
              className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Practice Weak Areas
            </Link>
          </div>
        )}

        {!statsLoading && !statsError && !allCaughtUp && (
          <>
            {/* Today's Revision — a compact info card (Qbank12.png §7 keeps
                this separate from the session-length picker and the Start
                button below, rather than one bundled block). */}
            <div className="hm-card !border-info-soft !bg-info-soft p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-info">Today&apos;s Revision</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--color-text)]">
                {totalDue} question{totalDue === 1 ? "" : "s"} due
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Estimated time: ~{estimatedMinutes} min</p>
            </div>

            {/* Session length — Phase 3C's explicit sizing control. */}
            <div className="hm-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Session Length</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {TIME_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinutes(m);
                      setCustomMinutes("");
                    }}
                    aria-pressed={!isCustom && minutes === m}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      !isCustom && minutes === m ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Custom"
                  aria-label="Custom minutes"
                  className="hm-input w-20 !py-1.5 text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={startSmartRevision}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              Start Smart Revision
              <span aria-hidden="true">→</span>
            </button>

            {/* Revision Summary */}
            <div>
              <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Revision Summary</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="hm-card p-3.5">
                  <p className="text-xl font-extrabold text-info">{dueToday}</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">Due Today</p>
                </div>
                <div className="hm-card p-3.5">
                  <p className="text-xl font-extrabold text-brand-red">{overdue}</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">Overdue</p>
                </div>
                <div className="hm-card p-3.5">
                  <p className="text-xl font-extrabold text-brand-red">{stats?.weak ?? 0}</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">Weak</p>
                </div>
                <div className="hm-card p-3.5">
                  <p className="text-xl font-extrabold text-amber-700">{stats?.recent_mistakes ?? 0}</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">Recent Mistakes</p>
                </div>
              </div>
            </div>

            {stats?.revision_accuracy != null && (
              <div className="hm-card flex items-center justify-between p-4">
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">Revision accuracy</p>
                <p className="text-lg font-extrabold text-[var(--color-text)]">{stats.revision_accuracy}%</p>
              </div>
            )}

            {stats?.daily_activity?.length > 0 && (
              <div className="hm-card p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Revision Activity</p>
                <div className="flex flex-col gap-1.5">
                  {stats.daily_activity.map((row) => (
                    <div key={row.date} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">
                        {new Date(row.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="font-bold text-[var(--color-text)]">{row.count} question{row.count === 1 ? "" : "s"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Categories — only categories with real data render */}
            {visibleCategories.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-[var(--color-text)]">Revision Categories</p>
                {visibleCategories.map((cat) => (
                  <div key={cat.key} className="hm-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => selectCategory(cat.key)}
                      aria-expanded={activeCategory === cat.key}
                      className="flex w-full items-center gap-3 p-3.5 text-left"
                    >
                      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg ${cat.accent}`} aria-hidden="true">
                        {cat.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--color-text)]">{cat.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{stats[cat.statKey]} question{stats[cat.statKey] === 1 ? "" : "s"}</p>
                      </span>
                      <span aria-hidden="true" className={`flex-none text-[var(--color-text-muted)] transition ${activeCategory === cat.key ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </button>

                    {activeCategory === cat.key && (
                      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-3.5">
                        <Link
                          href={`/qbank/practice?status=${cat.key}&auto=1`}
                          className="rounded-xl bg-brand-blue py-2 text-center text-xs font-bold text-white"
                        >
                          Practice all {stats[cat.statKey]} →
                        </Link>

                        {categoryLoading && (
                          <>
                            <SkeletonCard />
                            <SkeletonCard />
                          </>
                        )}
                        {!categoryLoading && categoryError && (
                          <p className="text-xs text-brand-red">Couldn&apos;t load these questions.</p>
                        )}
                        {!categoryLoading && !categoryError && categoryQuestions?.map((q) => {
                          const mastery = MASTERY_META[q.mastery_status];
                          return (
                            <Link key={q.id} href={`/qbank/question/${q.id}`} className="hm-card p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-brand-blue">{q.subject_name}</span>
                                {mastery && (
                                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${mastery.className}`}>
                                    {mastery.label}
                                  </span>
                                )}
                              </div>
                              <div className="line-clamp-2 text-sm text-[var(--color-text)]">
                                <RichContent html={q.text} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function RevisionCenterPage() {
  return (
    <RequireAuth>
      <RevisionCenterContent />
    </RequireAuth>
  );
}
