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
        <div className="hm-scrollbar-none min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
