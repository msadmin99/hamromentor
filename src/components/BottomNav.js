"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isMoreActive, isTabActive, PRIMARY_TABS } from "@/lib/bottomNav";
import { ChartIcon, HomeIcon, QBankIcon, TestsIcon, UserIcon } from "./icons";
import MoreMenu from "./MoreMenu";

// Icon per tab href — kept here (not in lib/bottomNav.js) so that module
// stays framework-free and directly testable under this repo's plain
// `node --test` runner. See lib/bottomNav.js for the tab config, the
// active-route matching, and why "QBank"/Bookmarks moved where they did.
const ICONS = {
  "/home": HomeIcon,
  "/qbank": QBankIcon,
  "/exams": TestsIcon,
  "/performance": ChartIcon,
};

export default function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const moreActive = menuOpen || isMoreActive(pathname);

  return (
    <>
      <nav aria-label="Primary navigation" className="sticky bottom-0 z-20 flex border-t border-[var(--color-border)] bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        {PRIMARY_TABS.map((tab) => {
          const Icon = ICONS[tab.href];
          const active = isTabActive(tab, pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <span className={active ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
                <Icon active={active} />
              </span>
              <span className={active ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>{tab.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
        >
          <span className={moreActive ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
            <UserIcon active={moreActive} />
          </span>
          <span className={moreActive ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>More</span>
        </button>
      </nav>

      {menuOpen && <MoreMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
