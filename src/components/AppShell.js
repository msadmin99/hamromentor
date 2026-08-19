"use client";

import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

export default function AppShell({ children, showNav = true }) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-[var(--color-surface-muted)]">
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
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="hm-scrollbar-none min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
