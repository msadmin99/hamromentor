"use client";

import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

export default function AppShell({ children, showNav = true }) {
  return (
    // h-dvh (not min-h-dvh) is load-bearing: a *minimum* height still lets
    // this wrapper grow taller than the viewport once content is added, at
    // which point there's nothing left to scroll internally — the whole
    // page (Header, Sidebar, BottomNav included) scrolls as one long
    // document instead, which is what made the header/bottom nav drift
    // away while scrolling on mobile/iPad instead of staying put. Pinning
    // the shell to exactly the viewport height forces the inner
    // overflow-y-auto region below to be the only thing that scrolls.
    <div className="flex h-dvh overflow-x-hidden bg-[var(--color-surface-muted)]">
      {showNav && <Sidebar />}
      {/* min-w-0 on both flex children below is load-bearing, not decorative:
          a flex item's default min-width is `auto`, meaning the browser won't
          shrink it below its content's natural (min-content) width. Without
          this, any wide descendant anywhere in `children` (an unwrapped
          table, a fixed-width chart, a long unbreakable string) silently
          forces this whole column — and everything in it, including the
          sticky Header — wider than the viewport on mobile, which is what
          produced the "half the page is cut off, have to scroll right"
          symptom across multiple pages that all render through AppShell. */}
      <div className="flex h-dvh min-w-0 flex-1 flex-col">
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
