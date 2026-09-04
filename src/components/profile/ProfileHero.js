"use client";

import Link from "next/link";
import { EditIcon } from "../icons";

/**
 * Profile redesign (Phase B) — horizontal hero card: avatar, name, active
 * course, email, and an Edit Profile CTA. Every field is read straight off
 * the existing `useAuth()` user object (see profile/page.js) — nothing new
 * is fetched, nothing is invented if a field is empty.
 *
 * "Edit Profile" links to /settings rather than a new editor: /settings is
 * the only place account fields are actually editable today (name, in
 * particular). Inventing a separate profile-editing surface would be new
 * functionality this phase isn't authorized to build.
 *
 * Subtle brand-tinted background (a soft wash of the existing teal tokens,
 * not a new color and not the bold saturated gradient the top Header
 * already uses) — per the brief's explicit "avoid excessive gradients."
 */
export default function ProfileHero({ user, courseName }) {
  const initial = (user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Student";

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand-teal-via)]/[0.06] to-[var(--color-brand-teal-to)]/[0.12] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand-blue text-xl font-bold text-white sm:h-[72px] sm:w-[72px] sm:text-2xl">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-[var(--color-text)] sm:text-xl">{fullName}</p>
            {courseName && <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-marketing-bar)]">{courseName}</p>}
            {user?.email && <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>}
          </div>
        </div>

        <Link
          href="/settings"
          className="flex min-h-[44px] flex-none items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:border-brand-blue hover:text-brand-blue"
        >
          <EditIcon /> Edit Profile
        </Link>
      </div>
    </section>
  );
}
