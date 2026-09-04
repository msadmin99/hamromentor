"use client";

import Link from "next/link";
import { ChevronRightIcon } from "../icons";

/**
 * Profile redesign (Phase B) — one reusable grouped-row primitive, used for
 * Study Resources / Account & Settings / Help & Support / About, instead of
 * four near-duplicate components. Every row links to a route that already
 * exists elsewhere in the app (QBank, Bookmarks, Mistakes, Test History,
 * Videos, My Performance, Settings, FAQ, Terms, Refund Policy) — nothing
 * new is routed here, this page only surfaces existing destinations in one
 * place.
 */
export function ProfileNavSection({ title, children }) {
  return (
    <section>
      {title && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>}
      <div className="hm-card divide-y divide-[var(--color-border)]">{children}</div>
    </section>
  );
}

export function ProfileNavRow({ href, onClick, Icon, label, description, tone = "default" }) {
  const labelClass = tone === "danger" ? "text-brand-red" : "text-[var(--color-text)]";
  const iconClass = tone === "danger" ? "bg-brand-red-light text-brand-red" : "bg-brand-blue/10 text-brand-blue";
  const className = "flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--color-surface-muted)]";

  const content = (
    <>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${iconClass}`}>
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${labelClass}`}>{label}</p>
        {description && <p className="truncate text-xs text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {!onClick && <ChevronRightIcon className="flex-none text-[var(--color-text-muted)]" aria-hidden="true" />}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
