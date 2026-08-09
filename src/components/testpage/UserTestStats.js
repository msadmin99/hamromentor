"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";
import { EXAM_TYPE_PAGE_META } from "./examTypeMeta";

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function UserTestStats({ examType }) {
  const { activeCourse } = useCourse();
  const [stats, setStats] = useState(null);
  const meta = EXAM_TYPE_PAGE_META[examType] || {};

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/exam-type/${examType}/?${params.toString()}`)
      .then(setStats)
      .catch(() => setStats(null));
  }, [examType, activeCourse?.id]);

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">📈 Your {meta.shortLabel || "Test"} Stats</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xl font-extrabold text-[var(--color-marketing-bar)]">{stats ? stats.total_taken : "—"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Tests Attempted</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-[var(--color-marketing-bar)]">{stats ? `${stats.avg_accuracy}%` : "—"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Average Score</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-[var(--color-marketing-bar)]">{stats ? `${stats.best_accuracy}%` : "—"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Best Score</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-[var(--color-marketing-bar)]">
            {stats ? formatDuration(stats.total_time_seconds) : "—"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Total Time</p>
        </div>
      </div>
    </div>
  );
}
