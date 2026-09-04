/**
 * Mobile bottom navigation — pure config + route-matching logic.
 *
 * Separated from components/BottomNav.js (which owns the icons and
 * rendering) so the actual active-tab decision is a plain function this
 * repo's test runner (`node --test`, no DOM/rendering harness) can call
 * directly and assert real inputs/outputs against — the same pattern
 * already used for lib/examTimerAnnounce.js and lib/accessState.js.
 *
 * Five permanent tabs: Home, QBank, Tests, Progress, plus the More
 * button (handled separately below since it opens a menu rather than
 * navigating to its own href).
 *
 * "QBank" is a label only. The href is unchanged (/qbank, the existing
 * Practice Question Bank route) — nothing about the destination, the
 * backend, or Free Starter/entitlement identifiers changed.
 *
 * Bookmarks intentionally has no entry here — it moved into the More
 * menu (see components/MoreMenu.js) and is tracked in
 * MORE_MATCH_PREFIXES instead, purely so More's own active state can
 * recognize it.
 */

export const PRIMARY_TABS = [
  { href: "/home", label: "Home" },
  // excludePrefixes: QBank's own /qbank/* range would otherwise also
  // match /qbank/bookmarks, double-highlighting it alongside More (which
  // is where Bookmarks now lives).
  { href: "/qbank", label: "QBank", excludePrefixes: ["/qbank/bookmarks"] },
  {
    href: "/exams",
    label: "Tests",
    // Tests must read as active for the hub page itself AND every exam
    // type it links to — a student inside Mock/Daily/Grand/PYQ is still
    // in the "Tests" section, not looking at an inactive bottom bar.
    matchPrefixes: ["/exams", "/mock-test", "/daily-test", "/grand-test", "/past-year-questions"],
  },
  { href: "/performance", label: "Progress" },
];

// The More menu's own destinations (components/MoreMenu.js's ITEMS) —
// kept here too, deliberately duplicated as data rather than imported
// from a component file, so this module has zero React/JSX dependency
// and stays trivially importable from a plain test file.
export const MORE_MATCH_PREFIXES = ["/qbank/bookmarks", "/videos", "/courses", "/subscriptions", "/profile"];

/** Does `pathname` fall under any of `prefixes` — either an exact match
 *  or a real child route (`/exams/anything`), never a coincidental
 *  string prefix (`/examsomething` must NOT match `/exams`). */
export function isMatch(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Active-state decision for one PRIMARY_TABS entry. */
export function isTabActive(tab, pathname) {
  const matches = isMatch(pathname, tab.matchPrefixes || [tab.href]);
  const excluded = tab.excludePrefixes ? isMatch(pathname, tab.excludePrefixes) : false;
  return matches && !excluded;
}

/** Active-state decision for the More tab from route alone (the menu
 *  being currently open is a separate, additional reason — see
 *  BottomNav.js — so a student who navigated to a More destination and
 *  then closed the menu still sees More highlighted). */
export function isMoreActive(pathname) {
  return isMatch(pathname, MORE_MATCH_PREFIXES);
}
