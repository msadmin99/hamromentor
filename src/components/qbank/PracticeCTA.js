"use client";

import Link from "next/link";
import { TrophyIcon } from "@/components/icons";

/** Generic motivational CTA reused across every subject/chapter — deliberately
 * content-free (no subject-specific copy) so it stays true regardless of
 * which subject/chapter it's rendered under. */
export default function PracticeCTA({ href, label = "Start Practice" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-teal-50 p-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-brand-blue shadow-sm" aria-hidden="true">
        <TrophyIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-blue-dark">Keep Practicing!</p>
        <p className="text-xs text-[var(--color-text-muted)]">Consistent practice today, excellent results tomorrow.</p>
      </div>
      <Link
        href={href}
        className="flex-none rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
      >
        {label} ›
      </Link>
    </div>
  );
}
