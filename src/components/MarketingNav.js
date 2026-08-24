"use client";

import Link from "next/link";
import { useState } from "react";
import { hasAuthenticatedBefore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Logo from "./Logo";

const FALLBACK_LINKS = [
  { label: "Courses", url: "#courses" },
  { label: "Plans", url: "/plans" },
];

export default function MarketingNav({ links, ctaText = "Login/Signup", appBadgeText = "📱 App coming soon" }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navLinks = links && links.length > 0 ? links : FALLBACK_LINKS;

  // Logged in -> straight to the dashboard, no login prompt. Logged out but
  // this browser has authenticated before (login or register, tracked via
  // markAuthenticatedBefore) -> login, since they likely already have an
  // account. Never authenticated here before -> register, since forcing a
  // brand-new visitor through a login form first is just a dead end.
  const dashboardHref = user ? "/home" : hasAuthenticatedBefore() ? "/login" : "/register";
  const dashboardLabel = user ? "Go to Dashboard" : ctaText;

  return (
    <header className="sticky top-0 z-30 hm-marketing-bar">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo size={30} dark />

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => (
            <a key={l.label} href={l.url} className="text-sm font-semibold text-white/85 hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white/70">
            {appBadgeText}
          </span>
          {!loading && (
            <Link
              href={dashboardHref}
              className="rounded-full bg-[var(--color-marketing-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-marketing-navy)]"
            >
              {dashboardLabel}
            </Link>
          )}
        </div>

        <button onClick={() => setOpen((o) => !o)} className="text-white md:hidden" aria-label="Menu">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <a key={l.label} href={l.url} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold text-white/85">
              {l.label}
            </a>
          ))}
          {!loading && (
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-[var(--color-marketing-accent)] px-5 py-2.5 text-center text-sm font-bold text-[var(--color-marketing-navy)]"
            >
              {dashboardLabel}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
