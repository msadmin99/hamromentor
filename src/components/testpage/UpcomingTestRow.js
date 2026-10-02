"use client";

import { formatScheduleDay, formatScheduleParts, resolveExamSchedule } from "@/lib/examSchedule";

/** Compact, view-only list row for a Daily Test scheduled on a future
 * calendar day — matches PastTestRow's list-style treatment, but
 * deliberately has NO Start/Play/Attempt action of any kind: a
 * future-dated Daily Test cannot be started until its scheduled_start
 * (server-enforced — see tests_app/views.py: _start_attempt), so
 * offering one here would just be a button that fails.
 *
 * Grand Test schedule display/timezone fix: date tile and schedule box
 * now go through lib/examSchedule.js's shared, Asia/Kathmandu-explicit
 * helpers instead of local copies, and resolve the authoritative
 * schedule via resolveExamSchedule (matters for Grand Test's own
 * upcoming listing; Daily Test, which never has an ExamSession, falls
 * straight through to scheduled_start unchanged). */
export default function UpcomingTestRow({ test }) {
  const resolvedSchedule = resolveExamSchedule(test);
  const { day, month } = formatScheduleDay(resolvedSchedule?.start);
  const schedule = formatScheduleParts(resolvedSchedule?.start);

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] py-3 last:border-0">
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

      {schedule && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-bold text-[var(--color-navy)]">
          <span aria-hidden>📅</span>
          <span>{schedule.isoDate}</span>
          <span>{schedule.weekday}</span>
          <span>{schedule.time}</span>
        </div>
      )}
    </div>
  );
}
