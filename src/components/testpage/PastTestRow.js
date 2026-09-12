"use client";

import Link from "next/link";

const STATUS_META = {
  completed: { label: "Completed", className: "text-brand-green" },
  missed: { label: "Missed", className: "text-brand-red" },
};

function formatDay(value) {
  if (!value) return { day: "--", month: "" };
  const d = new Date(value);
  return { day: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }) };
}

/** Compact list row for past/completed daily tests — distinct from the
 * card grid used for today's available tests, matching the reference's
 * list-style treatment for history items. */
export default function PastTestRow({ test }) {
  const { day, month } = formatDay(test.scheduled_start || test.created_at);
  const meta = STATUS_META[test.card_status] || STATUS_META.completed;
  const isMissed = test.card_status === "missed";

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-none flex-col items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-center leading-none">
          <span className="text-sm font-extrabold text-[var(--color-text)]">{day}</span>
          <span className="text-[9px] font-semibold uppercase text-[var(--color-text-muted)]">{month}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--color-text)]">{test.title}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {test.question_count} Questions · {test.duration_minutes} Minutes
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className={`text-xs font-bold ${meta.className}`}>{meta.label}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {isMissed ? "You missed this test" : test.best_score != null ? `Best Score: ${test.best_score}%` : ""}
          </p>
        </div>
        {isMissed ? (
          // Daily Test schedule audit: this used to be a live "Attempt
          // Now →" link — before backend enforcement existed for Daily
          // Test's scheduled_start/end, that button actually worked,
          // letting a student attempt a test long after its 24-hour
          // window closed. Enforcement now exists (_start_attempt), so
          // the button would just fail with a 403 — replaced with the
          // same honest, disabled-button treatment ExamCard.js already
          // uses for a closed/missed exam, instead of offering an action
          // the server refuses.
          <span
            className="flex-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-2 text-xs font-bold text-[var(--color-text-muted)]"
            aria-disabled="true"
          >
            <span aria-hidden>⌛</span> Window Closed
          </span>
        ) : (
          <Link
            href={!test.latest_attempt_id ? `/tests/${test.id}` : `/tests/result/${test.latest_attempt_id}`}
            className="flex-none rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-xs font-bold text-[var(--color-text)]"
          >
            Review Test →
          </Link>
        )}
      </div>
    </div>
  );
}
