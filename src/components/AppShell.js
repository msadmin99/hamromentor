"use client";

import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

/** Second-stage mobile-scroll fix (see the h-svh comment below for stage
 * one). Header used to be rendered wherever a caller put it inside
 * `children` — which, for every page, meant INSIDE the scroll region
 * below, kept visually pinned only by its own `position: sticky`.
 * Real-device testing after the h-svh fix showed content still going
 * blank mid-scroll and reappearing on scroll-back — consistent with a
 * known mobile WebKit/Blink compositing risk for a `sticky` element whose
 * nearest scrolling ancestor is a nested (non-document-body)
 * `overflow-y-auto` container, exactly this shape. The already-working
 * `.hm-app-shell` (Solve/Practice pages, globals.css) never has this
 * problem because its Header sits OUTSIDE its scroll region entirely, as
 * a plain flex sibling — sticky positioning is structurally never engaged
 * there.
 *
 * `header` is an explicit, optional slot that renders in that same
 * outside-the-scroller position: <AppShell header={<Header .../>}>. It
 * is the ONLY way to get a page's Header out of the scroll region —
 * deliberately no automatic detection of a `<Header>` child, so only
 * pages that explicitly opt in are affected (today: just QBank, the page
 * with a confirmed real-device report). Every other existing caller keeps
 * rendering `<Header>` as a plain child inside `children`, unchanged,
 * exactly as before this fix. Header.js itself needs no change either
 * way — its `sticky` class is only ever inert (no scrolling ancestor) or
 * active (inside the scroll region, current behavior for unmigrated
 * pages), never broken by this prop's presence or absence. */
export default function AppShell({ children, header = null, showNav = true }) {
  return (
    // h-svh (not min-h-dvh, and not h-dvh) is load-bearing on two separate
    // counts:
    //
    // 1. A *minimum* height still lets this wrapper grow taller than the
    //    viewport once content is added, at which point there's nothing
    //    left to scroll internally — the whole page (Header, Sidebar,
    //    BottomNav included) scrolls as one long document instead, which is
    //    what made the header/bottom nav drift away while scrolling on
    //    mobile/iPad instead of staying put. Pinning the shell to exactly
    //    the viewport height forces the inner overflow-y-auto region below
    //    to be the only thing that scrolls.
    //
    // 2. `svh` over `dvh`: `dvh` (dynamic viewport height) recalculates
    //    LIVE as the browser's address bar/toolbar auto-hides during a
    //    scroll gesture. `svh` (small viewport height) is pinned to the
    //    SMALLEST the viewport can ever be and never changes when the
    //    address bar shows/hides. Same fix already proven for the
    //    identical bug class in globals.css's `.hm-app-shell` (see its own
    //    "Android Daily Test white-screen fix" comment) — this brings the
    //    shared shell every other page uses onto the same stable unit.
    //    (Kept from the first-stage fix; real-device testing afterward
    //    showed a second, independent contributor — see the `header` prop
    //    docstring above for the fix that addresses it.)
    <div className="flex h-svh overflow-x-hidden bg-[var(--color-surface-muted)]">
      {showNav && <Sidebar />}
      {/* min-w-0 on both flex children below is load-bearing, not decorative:
          a flex item's default min-width is `auto`, meaning the browser won't
          shrink it below its content's natural (min-content) width. Without
          this, any wide descendant anywhere in `children` (an unwrapped
          table, a fixed-width chart, a long unbreakable string) silently
          forces this whole column — and everything in it, including a
          sticky Header — wider than the viewport on mobile, which is what
          produced the "half the page is cut off, have to scroll right"
          symptom across multiple pages that all render through AppShell. */}
      <div className="flex h-svh min-w-0 flex-1 flex-col">
        {header}
        {/* min-h-0 alongside flex-1: a flex item's default min-height is
            `auto` (its content's own height), which can let this div ignore
            flex-1's computed height and grow past the shell instead of
            scrolling internally — the exact "one clear scrolling model"
            this shell exists to guarantee. min-h-0 makes flex-1 actually
            win. pb-[...] reserves room for BottomNav, now position:fixed
            (removed from flow) instead of sticky — see BottomNav.js. */}
        <div
          className={`hm-scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden ${
            showNav ? "pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0" : ""
          }`}
        >
          {children}
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
