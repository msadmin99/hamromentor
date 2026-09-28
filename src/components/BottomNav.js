"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { hasAuthenticatedBefore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isMoreActive, isTabActive, PRIMARY_TABS } from "@/lib/bottomNav";
import { ChartIcon, HomeIcon, QBankIcon, TestsIcon, UserIcon, VideosIcon } from "./icons";
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
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const moreActive = menuOpen || isMoreActive(pathname);

  return (
    <>
      {/* position: fixed, not sticky — sticky only pins within its nearest
          scrolling ancestor, so it stays correctly placed only as long as
          that ancestor's own containment never breaks (a nested-flex/
          overflow edge case some mobile browser engines handle
          inconsistently). Fixed pins to the viewport itself regardless of
          any ancestor's scroll context, which is the actual guarantee this
          bar needs. Removed from flow entirely — AppShell reserves matching
          bottom clearance on the scrollable content instead. */}
      <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--color-border)] bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* Desktop audit (2026-09-28): PRIMARY_TABS and the More menu
            (bookmarks, subscriptions, profile, Log out) all assume an
            authenticated student. Every other page reaching BottomNav is
            still behind RequireAuth, so `user` is already guaranteed there
            and this is a no-op for them; only /mcq-of-the-day (now public)
            can actually render this component while anonymous. The
            desktop nav rail's own header component got the equivalent
            fix for the same reason — kept as two independent branches
            here, not shared, to respect this file's own zero-coupling
            rule (see lib/bottomNav.test.mjs). */}
        {user ? (
          <>
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
          </>
        ) : (
          <>
            <Link
              href="/mcq-of-the-day"
              aria-current={pathname === "/mcq-of-the-day" ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <span className={pathname === "/mcq-of-the-day" ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
                <QBankIcon active={pathname === "/mcq-of-the-day"} />
              </span>
              <span className={pathname === "/mcq-of-the-day" ? "text-brand-blue" : "text-[var(--color-text-muted)]"}>
                MCQ of the Day
              </span>
            </Link>
            <Link href="/courses" className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
              <span className="text-[var(--color-text-muted)]">
                <VideosIcon active={false} />
              </span>
              <span className="text-[var(--color-text-muted)]">Courses</span>
            </Link>
            <Link
              href={hasAuthenticatedBefore() ? "/login" : "/register"}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <span className="text-[var(--color-text-muted)]">
                <UserIcon active={false} />
              </span>
              <span className="text-[var(--color-text-muted)]">{hasAuthenticatedBefore() ? "Log in" : "Sign up"}</span>
            </Link>
          </>
        )}
      </nav>

      {user && menuOpen && <MoreMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
