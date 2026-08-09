"use client";

import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

export default function AppShell({ children, showNav = true }) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-[var(--color-surface-muted)]">
      {showNav && <Sidebar />}
      <div className="flex min-h-dvh flex-1 flex-col">
        <div className="hm-scrollbar-none flex-1 overflow-y-auto">{children}</div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
