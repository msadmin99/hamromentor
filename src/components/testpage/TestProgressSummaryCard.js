"use client";

import Link from "next/link";
import AccuracyRing from "@/components/qbank/AccuracyRing";
import { statusBreakdown } from "./examTypeMeta";

/** Secondary "Test Progress" card — completion breakdown across the whole
 * catalog (Completed/In Progress/Not Attempted counts), distinct from the
 * per-exam-type accuracy stats in UserTestStats. Pure computation over the
 * already-fetched test list; detailed analytics stay on /performance,
 * this is intentionally just a summary + a link there. */
export default function TestProgressSummaryCard({ tests, loading }) {
  if (loading) {
    return (
      <div className="hm-card animate-pulse p-4">
        <div className="h-4 w-28 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-4 h-20 w-20 rounded-full bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  const { all, notAttempted, inProgress, completed } = statusBreakdown(tests);
  const completionPct = all ? Math.round((completed / all) * 100) : 0;

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Test Progress</p>
      <div className="mt-3 flex items-center gap-4">
        <AccuracyRing percent={completionPct} label="Completed" size={80} stroke={8} />
        <div className="flex flex-1 flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Completed</span>
            <span className="font-bold text-[var(--color-text)]">{completed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">In Progress</span>
            <span className="font-bold text-[var(--color-text)]">{inProgress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Not Attempted</span>
            <span className="font-bold text-[var(--color-text)]">{notAttempted}</span>
          </div>
        </div>
      </div>
      <Link href="/performance" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
        View Detailed Progress →
      </Link>
    </div>
  );
}
