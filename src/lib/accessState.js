/**
 * Phase 10 — the one place the student UI turns a backend access decision
 * into something on screen.
 *
 * The rule this file exists to enforce: the frontend renders decisions, it
 * does not make them. Every function here reads `test.access` — the
 * server-authoritative block produced by `tests_app/card_access.py` from
 * the Phase 4 capability engine — and nothing else. In particular it never
 * looks at `is_pro`, `price`, or a subscription object to decide whether
 * something is locked. The card used to do exactly that
 * (`is_pro && card_status !== "completed"`), which showed a padlock to
 * every subscriber, scholarship holder and Free Starter user on the
 * platform.
 *
 * Hiding a button here is UX. Enforcement happens server-side on the
 * actual action (`_start_attempt`, `SubmitTestView`, `TestResultView`) —
 * a student who calls the API directly gets the same answer.
 *
 * Pure functions, no React, no fetching: importable by tests
 * (`accessState.test.mjs`) and by any component.
 */

/** Fallback used when a response predates the `access` block. Renders as a
 *  plain, honest "open it and find out" rather than inventing a verdict. */
const UNKNOWN = {
  state: "start",
  can_start: true,
  can_continue: false,
  can_review: false,
  reason_code: "",
  upgrade_available: false,
  source: "none",
  attempts_left: null,
  latest_attempt_id: null,
  in_progress_attempt_id: null,
};

export function accessOf(test) {
  return test && test.access ? test.access : UNKNOWN;
}

/**
 * Presentation for one card/detail action, derived solely from the
 * backend state. `tone` is a semantic name, never a colour — callers map
 * it to their own classes, and every state also carries a distinct label
 * and icon so state is never communicated by colour alone (a11y).
 */
const PRESENTATION = {
  continue: { label: "In Progress", cta: "Continue Test", icon: "▶️", tone: "progress" },
  review: { label: "Completed", cta: "Review Test", icon: "📖", tone: "done" },
  start: { label: "Available", cta: "Start Test", icon: "🎯", tone: "ready" },
  upcoming: { label: "Upcoming", cta: "Not open yet", icon: "🕒", tone: "waiting", disabled: true },
  closed: { label: "Closed", cta: "Closed", icon: "🔔", tone: "closed", disabled: true },
  attempts_exhausted: { label: "No attempts left", cta: "No attempts left", icon: "🚫", tone: "closed", disabled: true },
  locked: { label: "Locked", cta: "Unlock Test", icon: "🔒", tone: "locked" },
};

export function cardPresentation(test) {
  const access = accessOf(test);
  const base = PRESENTATION[access.state] || PRESENTATION.start;
  return { ...base, disabled: Boolean(base.disabled), state: access.state };
}

/**
 * Where the primary action should go. Review opens the actual result page
 * (not the generic detail page, which has no per-question review);
 * everything else goes to the test detail page, where the server gets to
 * make the real decision when the student acts.
 */
export function primaryHref(test) {
  const access = accessOf(test);
  if (access.state === "review" && access.latest_attempt_id) {
    return `/tests/result/${access.latest_attempt_id}`;
  }
  return `/tests/${test.id}`;
}

export function isLocked(test) {
  return accessOf(test).state === "locked";
}

/**
 * Human copy for a denial. Deliberately per-reason: "you've used your free
 * test" and "this needs a subscription" and "the window closed" are
 * different situations and a single "Locked" helps nobody. Machine-readable
 * `reason_code` stays available on the access block for anything that needs
 * to branch on it.
 */
const DENIAL_COPY = {
  free_limit_reached: {
    title: "You've used your free access",
    body: "Your free allowance for this type of test is finished. Upgrade to keep going.",
    action: "View plans",
    href: "/plans",
  },
  purchase_required: {
    title: "This test needs a subscription",
    body: "Get access to this and everything else in the package.",
    action: "View plans",
    href: "/plans",
  },
  subscription_expired: {
    title: "Your subscription has expired",
    body: "Renew to pick up where you left off.",
    action: "Renew",
    href: "/plans",
  },
  exam_not_open: {
    title: "This exam hasn't opened yet",
    body: "It will become available when the exam window starts.",
    action: null,
    href: null,
  },
  exam_closed: {
    title: "This exam has closed",
    body: "The exam window has ended, so it can no longer be started.",
    action: null,
    href: null,
  },
  attempt_limit_reached: {
    title: "No attempts left",
    body: "You've used every attempt allowed for this test.",
    action: null,
    href: null,
  },
  registration_required: {
    title: "Registration required",
    body: "Register for this exam to take part.",
    action: null,
    href: null,
  },
  password_required: {
    title: "Password required",
    body: "Enter the exam password to begin.",
    action: null,
    href: null,
  },
  authentication_required: {
    title: "Sign in to continue",
    body: "You need an account to start this test.",
    action: "Sign in",
    href: "/login",
  },
  assignment_required: {
    title: "Not assigned to you",
    body: "This exam hasn't been assigned to your course or batch.",
    action: null,
    href: null,
  },
  not_entitled: {
    title: "Not available on your plan",
    body: "This isn't included in the access you currently have.",
    action: "View plans",
    href: "/plans",
  },
};

const GENERIC_DENIAL = {
  title: "Not available right now",
  body: "This isn't available to open at the moment.",
  action: null,
  href: null,
};

export function denialCopy(reasonCode) {
  if (!reasonCode) return null;
  return DENIAL_COPY[reasonCode] || GENERIC_DENIAL;
}

/**
 * The copy for a card/detail page that can't be started, or null when it
 * can. Includes `upgrade_available` so a caller can show a buy path only
 * where the backend says one actually exists — never a fabricated one.
 */
export function denialFor(test) {
  const access = accessOf(test);
  if (access.can_start || access.can_continue || access.can_review) return null;
  const copy = denialCopy(access.reason_code);
  if (!copy) return null;
  return { ...copy, upgradeAvailable: Boolean(access.upgrade_available) };
}

/**
 * How the student currently holds access, for a short "why can I see
 * this" line. Never exposes internal ids — just the kind of source.
 */
const SOURCE_LABEL = {
  subscription: "Included in your subscription",
  scholarship: "Included with your scholarship",
  direct_purchase: "You bought this",
  combo: "Included in your combo",
  free_starter: "Using your free access",
  course_enrollment: "Included with your course",
  individual_assignment: "Assigned to you",
  batch_assignment: "Assigned to your batch",
  admin_override: "Granted by your institution",
};

export function sourceLabel(test) {
  const access = accessOf(test);
  if (!(access.can_start || access.can_continue)) return null;
  return SOURCE_LABEL[access.source] || null;
}

/**
 * Free Starter quota, from `GET /api/entitlements/mine/`. Never computed
 * or cached client-side — the server owns the number, and browsing never
 * consumes it.
 */
export function quotaFor(entitlements, resourceType) {
  if (!Array.isArray(entitlements)) return null;
  const row = entitlements.find((e) => e.resource_type === resourceType);
  if (!row) return null;
  if (row.unlimited) return { unlimited: true, remaining: null, used: row.used ?? 0, exhausted: false };
  // Prefer the server's own `remaining` (FreeStarterEntitlement.remaining)
  // and only fall back to arithmetic if an older response omits it — the
  // number belongs to the server, which is also the only thing that may
  // decrement it.
  const remaining = Math.max(0, row.remaining ?? (row.quantity ?? 0) - (row.used ?? 0));
  return { unlimited: false, remaining, used: row.used ?? 0, exhausted: remaining === 0 };
}

/** Which Free Starter bucket an exam type draws on — mirrors
 *  `tests_app/card_access.py: FREE_STARTER_RESOURCE`. */
export const FREE_STARTER_RESOURCE = {
  mock: "mock_test",
  qbank: "mock_test",
  daily: "daily_test",
  pyq: "pyq",
  grand: "grand_test",
};
