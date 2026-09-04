"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon, QBankIcon, TestsIcon } from "../icons";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

/**
 * Profile redesign (Phase B) — reuses the exact two endpoints already
 * consumed elsewhere for the same numbers (home/page.js and
 * performance/page.js both call these): `/performance/overview/` for
 * questions-attempted/accuracy/study-time, and `/attempts/mine/` for a
 * submitted-attempts count (same `status === "submitted"` filter
 * performance/page.js already uses for `recentAttempt`). No new backend
 * endpoint, no invented figure — if both come back empty, an honest empty
 * state is shown instead of a 0-filled grid.
 */
function formatSeconds(seconds) {
  const s = seconds || 0;
  const hours = Math.floor(s / 3600);
  const minutes = Math.round((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Stat({ icon, value, label }) {
  return (
    <div className="hm-card flex min-h-[44px] flex-col items-center gap-1 p-4 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">{icon}</span>
      <p className="mt-1 text-xl font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export default function ActivityStats() {
  const { activeCourse } = useCourse();
  const [kpis, setKpis] = useState(undefined); // undefined = loading, null = error
  const [testsCount, setTestsCount] = useState(undefined);

  useEffect(() => {
    const params = new URLSearchParams({ days: "30" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then((d) => setKpis(d.kpis || null))
      .catch(() => setKpis(null));
    api
      .get("/attempts/mine/")
      .then((attempts) => setTestsCount((attempts || []).filter((a) => a.status === "submitted").length))
      .catch(() => setTestsCount(null));
  }, [activeCourse?.id]);

  if (kpis === undefined || testsCount === undefined) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="hm-card flex animate-pulse flex-col items-center gap-1 p-4">
            <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-5 w-10 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-3 w-14 rounded bg-[var(--color-surface-muted)]" />
          </div>
        ))}
      </div>
    );
  }

  const noActivity = !kpis?.questions_attempted && !testsCount;
  if (noActivity) {
    return (
      <div className="hm-card p-5 text-center">
        <p className="text-sm font-bold text-[var(--color-text)]">Your learning story starts here</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--color-text-muted)]">
          Take your first test or practice a few questions to start building your activity history.
        </p>
        <Link href="/exams" className="mt-3 inline-block min-h-[40px] rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold leading-6 text-white">
          Browse Tests →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat icon={<QBankIcon />} value={kpis?.questions_attempted ?? "—"} label="Questions" />
      <Stat icon={<CheckCircleIcon />} value={kpis?.overall_accuracy != null ? `${kpis.overall_accuracy}%` : "—"} label="Accuracy" />
      <Stat icon={<TestsIcon />} value={testsCount ?? "—"} label="Tests Taken" />
      <Stat icon={<ClockIcon />} value={kpis ? formatSeconds(kpis.total_study_seconds) : "—"} label="Study Time" />
    </div>
  );
}
