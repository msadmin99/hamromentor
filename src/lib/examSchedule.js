/**
 * Grand Test schedule display/timezone fix — the single, shared place
 * that (a) resolves which schedule is authoritative for a given Test row
 * and (b) formats any exam schedule timestamp, so ExamCard.js,
 * UpcomingTestRow.js, PastTestRow.js, GrandTestStatusPanel.js, and the
 * exam detail page no longer each carry their own ad-hoc copy (three of
 * which were byte-for-byte duplicates, two more doing the same thing
 * with slightly different options) — see this module's own history for
 * why: a Grand Test's schedule configured by the admin was not reliably
 * reaching the student UI, partly because the display always read the
 * raw `scheduled_start`/`scheduled_end` fields and never the
 * session-resolved `grand_test_schedule` the backend already computes
 * (tests_app.lifecycle.resolve_test_schedule_session).
 *
 * The platform uses exactly one timezone for exam scheduling,
 * Asia/Kathmandu (confirmed: ExamSession.timezone defaults to it and no
 * other zone is used anywhere in this codebase) — every date/time below
 * is rendered explicitly in that zone via Intl's own `timeZone` option,
 * never the viewer's browser-local zone. The backend already sends a
 * real UTC-offset-aware ISO datetime (Django's DRF default), so no
 * timezone library is needed here — passing `timeZone: EXAM_TIMEZONE` to
 * the standard `toLocaleDateString`/`toLocaleTimeString`/`toLocaleString`
 * calls is sufficient and introduces no second timezone mechanism.
 */

export const EXAM_TIMEZONE = "Asia/Kathmandu";

/**
 * Which schedule actually governs this Test. For a Grand Test, prefers
 * the backend's session-resolved `grand_test_schedule` (a real
 * ExamSession's own start/end when one exists, else the plain fields —
 * see TestListSerializer.get_grand_test_schedule) over the raw
 * `scheduled_start`/`scheduled_end`, which may be stale or entirely
 * disconnected from the real schedule once a Grand Test has been
 * rescheduled. Every other exam type (Daily Test, which has no
 * ExamSession concept in practice) falls straight through to the plain
 * fields, unchanged from before this fix. Returns null when there is no
 * schedule at all — never invents one.
 */
export function resolveExamSchedule(test) {
  if (!test) return null;
  if (test.grand_test_schedule && test.grand_test_schedule.start) {
    return { start: test.grand_test_schedule.start, end: test.grand_test_schedule.end || null };
  }
  if (test.scheduled_start) {
    return { start: test.scheduled_start, end: test.scheduled_end || null };
  }
  return null;
}

/** ISO date + full weekday + 12h time, explicitly in Asia/Kathmandu —
 * the "📅 2026-10-03  Saturday  7:00 PM" box ExamCard.js/UpcomingTestRow.js/
 * PastTestRow.js all render. Null for a missing or invalid value — never
 * a fabricated date. */
export function formatScheduleParts(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    isoDate: d.toLocaleDateString("en-CA", { timeZone: EXAM_TIMEZONE }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long", timeZone: EXAM_TIMEZONE }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: EXAM_TIMEZONE }),
  };
}

/** {day, month} for the compact date-tile UpcomingTestRow.js/
 * PastTestRow.js show to the left of the title — also explicit
 * Asia/Kathmandu, so the tile and the schedule box below it can never
 * disagree about which calendar day this is. */
export function formatScheduleDay(value) {
  if (!value) return { day: "--", month: "" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { day: "--", month: "" };
  return {
    day: Number(d.toLocaleString("en-US", { day: "numeric", timeZone: EXAM_TIMEZONE })),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: EXAM_TIMEZONE }),
  };
}

/** Full weekday + day + month + year + time, for GrandTestStatusPanel's
 * "Exam window: ..." line and the exam detail page's denial-card
 * Opens/Closed lines. */
export function formatScheduleDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: EXAM_TIMEZONE,
  });
}

/** Day + month + year only (no weekday/time) — the exam detail page's
 * own shorter `formatDate`. */
export function formatScheduleDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: EXAM_TIMEZONE });
}
