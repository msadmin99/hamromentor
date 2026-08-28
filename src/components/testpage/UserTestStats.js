"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";
import AccuracyRing from "@/components/qbank/AccuracyRing";
import { EXAM_TYPE_PAGE_META } from "./examTypeMeta";

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function UserTestStats({ examType, headerExtra }) {
  const { activeCourse } = useCourse();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const meta = EXAM_TYPE_PAGE_META[examType] || {};

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/exam-type/${examType}/?${params.toString()}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [examType, activeCourse?.id]);

  if (loading) {
    return (
      <div className="hm-card animate-pulse p-4">
        <div className="h-4 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-4 h-24 w-24 rounded-full bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
          <span aria-hidden="true">📈</span> Your {meta.shortLabel || "Test"} Stats
        </p>
        {headerExtra}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <AccuracyRing percent={stats ? Math.round(stats.avg_accuracy) : null} label="Average Score" size={96} />
        <div className="grid flex-1 grid-cols-1 gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Tests Attempted</span>
            <span className="font-bold text-[var(--color-text)]">{stats ? stats.total_taken : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Best Score</span>
            <span className="font-bold text-[var(--color-text)]">{stats ? `${stats.best_accuracy}%` : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Total Time</span>
            <span className="font-bold text-[var(--color-text)]">{stats ? formatDuration(stats.total_time_seconds) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
