"use client";

function formatDay(value) {
  if (!value) return { day: "--", month: "" };
  const d = new Date(value);
  return { day: d.getDate(), month: d.toLocaleDateString("en-US", { month: "short" }) };
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Compact, view-only list row for a Daily Test scheduled on a future
 * calendar day — matches PastTestRow's list-style treatment, but
 * deliberately has NO Start/Play/Attempt action of any kind: a
 * future-dated Daily Test cannot be started until its scheduled_start
 * (server-enforced — see tests_app/views.py: _start_attempt), so
 * offering one here would just be a button that fails. */
export default function UpcomingTestRow({ test }) {
  const { day, month } = formatDay(test.scheduled_start);

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

      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)]">
        <span aria-hidden>🕒</span> Opens {formatTime(test.scheduled_start)}
      </div>
    </div>
  );
}
