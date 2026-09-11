"use client";

import Link from "next/link";
import AccuracyRing from "./AccuracyRing";

function formatStudyTime(seconds) {
  const s = seconds || 0;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  return [h ? `${h}h` : null, `${m}m`].filter(Boolean).join(" ");
}

/** Compact progress card — all real, QBank-scoped numbers from the same
 * /questions/dashboard/ call the page already makes (no extra request).
 * Detailed breakdowns (by subject/chapter/topic, trends, mastery) stay on
 * the existing /performance page, not duplicated here. */
export default function ProgressSummary({ stats, loading }) {
  // Sized to match the loaded layout below almost exactly (same 112px
  // ring, same 4 stat rows at the same gap, same link line) — NOT
  // decorative. A shorter skeleton that jumps taller once `stats` arrives
  // is a real, reproduced mobile bug: when that height change lands while
  // the user is mid-scroll (this card sits mid-page, well past the fold),
  // the browser can commit the new, taller layout without having painted
  // the newly-added region yet, showing this card's title with a large
  // blank gap below it until a later repaint (e.g. reversing scroll
  // direction) catches up — exactly the "content blanks mid-scroll,
  // reappears on scroll back" report, confirmed frame-by-frame against a
  // screen recording that showed precisely this card's title rendering
  // with its body missing. Matching the skeleton height removes the shift
  // regardless of when the data happens to arrive relative to scrolling.
  if (loading || !stats) {
    return (
      <div className="hm-card animate-pulse p-4">
        <div className="h-4 w-24 rounded bg-[var(--color-surface-muted)]" />
        <div className="mb-3 mt-1.5 h-3 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="flex items-center gap-5">
          <div className="h-28 w-28 flex-none rounded-full bg-[var(--color-surface-muted)]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
            <div className="h-5 rounded bg-[var(--color-surface-muted)]" />
          </div>
        </div>
        <div className="mt-3 h-4 w-32 rounded bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  const rows = [
    { label: "Questions Attempted", value: stats.attempted },
    { label: "Correct Answers", value: stats.correct },
    { label: "Study Time", value: formatStudyTime(stats.study_seconds) },
    { label: "Topics Practiced", value: stats.topics_practiced },
  ];

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Your Progress</p>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">Overall performance</p>
      <div className="flex items-center gap-5">
        <AccuracyRing percent={stats.accuracy != null ? Math.round(stats.accuracy) : null} label="Overall Accuracy" />
        <div className="flex flex-1 flex-col gap-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{r.label}</span>
              <span className="font-bold text-[var(--color-text)]">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Link href="/performance" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
        View detailed progress →
      </Link>
    </div>
  );
}
