"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ArchiveIcon,
  ChartIcon,
  DailyTestIcon,
  GrandTestIcon,
  HomeIcon,
  MockTestIcon,
  QBankIcon,
  UserIcon,
  VideosIcon,
  WalletIcon,
} from "./icons";
import Logo from "./Logo";
import ProfileMenu from "./ProfileMenu";

const NAV = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/qbank", label: "Practice Question Bank", Icon: QBankIcon },
  { href: "/mock-test", label: "Mock Test", Icon: MockTestIcon },
  { href: "/daily-test", label: "Daily Test", Icon: DailyTestIcon },
  { href: "/grand-test", label: "Grand Test", Icon: GrandTestIcon },
  { href: "/past-year-questions", label: "Past Year Questions", Icon: ArchiveIcon },
  { href: "/videos", label: "Videos", Icon: VideosIcon },
  { href: "/courses", label: "Video Lecture Courses", Icon: VideosIcon },
  { href: "/performance", label: "My Performance", Icon: ChartIcon },
  { href: "/subscriptions", label: "My Subscriptions", Icon: WalletIcon },
];

const SIDEBAR_WIDTH = 240; // px — matches w-60, kept in sync with the collapse/reveal math below
const AUTO_HIDE_DELAY = 4000; // ms of inactivity before the sidebar auto-collapses

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto-hide behavior only — the sidebar's own markup/styling below is
  // untouched. `open` drives a slide animation via margin-left (see the
  // <aside> style prop): since the sidebar is a normal flex child, animating
  // its margin also smoothly reclaims/returns the space for the content area
  // next to it — no separate layout coordination with AppShell needed.
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!open || hovered) return undefined; // stay open indefinitely while hovered; nothing to schedule if already hidden
    const timer = setTimeout(() => setOpen(false), AUTO_HIDE_DELAY);
    return () => clearTimeout(timer);
  }, [open, hovered]);

  return (
    <>
      {!open && (
        <>
          {/* Invisible hover activation zone along the left edge — reveals the sidebar */}
          <div
            className="fixed inset-y-0 left-0 z-40 hidden w-3 md:block"
            onMouseEnter={() => {
              setOpen(true);
              setHovered(true);
            }}
          />
          <button
            onClick={() => setOpen(true)}
            onMouseEnter={() => setHovered(true)}
            aria-label="Show sidebar"
            className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 items-center rounded-r-lg border border-l-0 border-[var(--color-border)] bg-white py-3 pl-1 pr-1.5 text-[var(--color-text-muted)] shadow-md transition hover:text-[var(--color-text)] md:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ marginLeft: open ? 0 : -SIDEBAR_WIDTH }}
        className="hidden w-60 flex-none flex-col border-r border-[var(--color-border)] bg-white transition-[margin-left] duration-300 ease-in-out md:flex"
      >
        <div className="px-5 py-5">
          <Logo size={30} />
        </div>

        <nav className="hm-scrollbar-none flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-[var(--color-border)] px-3 py-4">
          {menuOpen && <ProfileMenu user={user} onClose={() => setMenuOpen(false)} />}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              menuOpen || pathname === "/profile"
                ? "bg-brand-blue/10 text-brand-blue"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <UserIcon active={menuOpen || pathname === "/profile"} />
            {user?.first_name || "Profile"}
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-red hover:bg-brand-red-light"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
