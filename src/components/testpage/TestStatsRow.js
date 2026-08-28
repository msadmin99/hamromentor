"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function formatDuration(totalSeconds) {
  const s = totalSeconds || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatItem({ value, label }) {
  return (
    <div className="flex-1 text-center sm:text-left">
      <p className="text-lg font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

/** Compact stats row — only the 4 numbers actually useful at a glance
 * (Tests Available / Tests Attempted / Best Score / Total Time Spent),
 * not a restatement of the full Performance page. `available` comes from
 * the already-fetched test list; the other three from the same real
 * per-exam-type endpoint UserTestStats already uses. */
export default function TestStatsRow({ examType, available, loading }) {
  const { activeCourse } = useCourse();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/exam-type/${examType}/?${params.toString()}`)
      .then(setStats)
      .catch(() => setStats(null));
  }, [examType, activeCourse?.id]);

  if (loading) {
    return (
      <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 flex-1 rounded bg-[var(--color-surface-muted)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 sm:flex-nowrap sm:gap-x-6">
      <StatItem value={available} label="Tests Available" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem value={stats ? stats.total_taken : "—"} label="Tests Attempted" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem value={stats ? `${stats.best_accuracy}%` : "—"} label="Best Score" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem value={stats ? formatDuration(stats.total_time_seconds) : "—"} label="Total Time Spent" />
    </div>
  );
}
