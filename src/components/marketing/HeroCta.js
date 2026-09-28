"use client";

import Link from "next/link";
import { hasAuthenticatedBefore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/** Same "where should this button actually go" logic MarketingNav's own
 * top-right CTA already uses — logged in -> straight to the dashboard,
 * never a login prompt; logged out but this browser has authenticated
 * before (tracked via markAuthenticatedBefore) -> login; never
 * authenticated here before -> register. Kept as its own small client
 * component (not part of the server-rendered LandingPage) for the same
 * reason MarketingNav is: this needs useAuth()/hasAuthenticatedBefore(),
 * neither of which a server component can call. */
function useSmartDestination() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? "/home" : hasAuthenticatedBefore() ? "/login" : "/register";
}

export function HeroPrimaryCta({ text, className }) {
  const href = useSmartDestination();
  if (!href) return null;
  return (
    <Link href={href} className={className}>
      {href === "/home" ? "Go to Dashboard" : text}
    </Link>
  );
}

/** The "MCQ of the Day" hero badge — logged in -> the new choose-your-
 * program flow (5 auto-rotating, program-scoped MCQs; see
 * src/app/mcq-of-the-day/page.js), never straight to a single question.
 * Logged out -> the same login/register destination as the primary CTA
 * above (that flow requires an account, same as the rest of QBank). */
export function HeroMcqBadge({ icon, title, tag, subtitle, ctaText, className }) {
  const { user, loading } = useAuth();
  const href = loading ? null : user ? "/mcq-of-the-day" : hasAuthenticatedBefore() ? "/login" : "/register";
  if (!href) return null;
  return (
    <Link href={href} className={className}>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-marketing-navy)]">{title}</span>
          {tag && (
            <span className="rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900">{tag}</span>
          )}
        </span>
        <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{subtitle}</span>
        <span className="mt-2 block text-xs font-bold text-[var(--color-marketing-accent)]">{ctaText}</span>
      </span>
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[var(--color-marketing-accent)] text-xl text-white shadow-inner">
        {icon}
      </span>
    </Link>
  );
}
