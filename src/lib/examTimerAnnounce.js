/**
 * Accessibility pass — what a screen reader should say about exam time
 * remaining, and when.
 *
 * ## The defect this replaces
 *
 * `TestPlayerHeader` carried `aria-live="polite"` directly on the element
 * showing the countdown, switched on once under five minutes. That element
 * re-renders every second, so a screen-reader user in the final five
 * minutes of a timed exam heard the clock read out **once per second** —
 * roughly 300 interruptions, over the exact stretch where they most need
 * to concentrate. A live region on a per-second counter is the textbook
 * way to make a page unusable.
 *
 * ## What replaces it
 *
 * The countdown itself is `aria-hidden` and stays purely visual (it is
 * still readable on demand — see `timerLabel`). A separate, otherwise
 * empty live region announces only meaningful milestones:
 *
 *     30 minutes → 10 → 5 → 2 → 1 minute → time is up
 *
 * `announcementFor()` is a pure function of the remaining seconds and the
 * last milestone already announced, which is what makes the "announce
 * once, never repeat" rule testable without a DOM.
 *
 * ## What this does NOT do
 *
 * It does not participate in timing. The authoritative deadline is the
 * server's `effective_end_at` (Phase 6: `MIN(attempt_start + duration,
 * session_end)`), auto-submission is server-side, and this module never
 * sees either. It decides wording only — if every line here were deleted,
 * the exam would end at exactly the same instant.
 */

/** Descending, because the countdown crosses them in this order. Each is a
 *  point a student actually changes behaviour at; a 15- or 20-minute mark
 *  would add noise without adding a decision. */
export const MILESTONES_SECONDS = [1800, 600, 300, 120, 60];

export const EXPIRED = 0;

function phrase(seconds) {
  if (seconds === 60) return "1 minute remaining.";
  return `${Math.round(seconds / 60)} minutes remaining.`;
}

/**
 * The announcement to make right now, or null for "say nothing".
 *
 * @param {number|null} remainingSeconds  from the display countdown
 * @param {number|null} lastAnnounced     the milestone already announced, or null
 * @returns {{milestone: number, message: string}|null}
 */
export function announcementFor(remainingSeconds, lastAnnounced) {
  if (remainingSeconds == null) return null;

  if (remainingSeconds <= 0) {
    // Announced once. Whether the attempt is actually finalized is the
    // server's call; this only tells the student the clock reached zero.
    if (lastAnnounced === EXPIRED) return null;
    return { milestone: EXPIRED, message: "Time is up. Your answers are being submitted." };
  }

  // The SMALLEST milestone at or above the current time — so a student who
  // opens the tab with 4 minutes left hears "5 minutes remaining", not the
  // 30-minute mark they never saw, and not a burst of every milestone.
  // findLast, not find: MILESTONES_SECONDS is descending, so the first
  // match is the largest one and the last match is the smallest.
  const crossed = MILESTONES_SECONDS.findLast((m) => remainingSeconds <= m);
  if (crossed == null) return null;

  // Milestones only ever fire on the way down. A smaller lastAnnounced
  // means we are already past this one — re-announcing would be the
  // repetition this module exists to prevent. (Time can jump backwards
  // when the tab wakes and re-syncs to the server deadline.)
  if (lastAnnounced != null && lastAnnounced <= crossed) return null;

  return { milestone: crossed, message: phrase(crossed) };
}

/**
 * The countdown as words, for the timer's accessible name — so a student
 * can query the exact time on demand even though the visual digits are
 * hidden from assistive technology between milestones.
 */
export function timerLabel(remainingSeconds) {
  if (remainingSeconds == null) return "Time remaining: not available";
  if (remainingSeconds <= 0) return "Time remaining: none. Time is up.";

  const total = Math.floor(remainingSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const parts = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  // Seconds are suppressed once there is more than a minute left: reading
  // "1 hour 12 minutes 43 seconds" is slower than useful, and the digits
  // are stale the moment they are spoken.
  if (!hours && (!minutes || total < 60)) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);

  return `Time remaining: ${parts.join(" ")}`;
}
