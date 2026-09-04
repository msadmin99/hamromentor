"use client";

import Link from "next/link";
import { CheckCircleIcon, LockIcon } from "@/components/icons";

// Shared by the four Videos routes (Phase D, Area 3) — hub, detail,
// subject, and chapter pages all render the same video-card metadata
// (duration, PRO/locked badge, watch progress, loading/error/breadcrumb
// shells) off the same VideoListSerializer/VideoDetailSerializer shape,
// so it's defined once here instead of copy-pasted into all four (same
// pattern as qbank/revisionListShared.js from Phase D, Area 1).

export function formatDuration(seconds) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.floor((seconds || 0) % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Was raw bg-amber-100/text-amber-700 in every card — moved onto the
// shared --color-warning token (Phase C) so this is one fewer ad-hoc
// amber instance outside the design-system tokens. Same rendered color.
export function AccessBadge({ hasAccess }) {
  if (hasAccess) return null;
  return (
    <span className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md bg-warning-soft px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
      <LockIcon /> PRO
    </span>
  );
}

// `progress` is VideoProgressSerializer's shape (or null/undefined if the
// student never started it — never fabricated). Completion always wins;
// otherwise a thin bar from max_position_seconds ("furthest point
// reached" per the model's own docstring — the correct field for "%
// watched", not last_position_seconds which is just the resume point).
export function WatchProgress({ progress, durationSeconds }) {
  if (!progress) return null;
  if (progress.is_completed) {
    return (
      <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-brand-green">
        <CheckCircleIcon className="h-3 w-3" /> Completed
      </span>
    );
  }
  const watched = progress.max_position_seconds || 0;
  if (!durationSeconds || watched <= 0) return null;
  const pct = Math.min(Math.round((watched / durationSeconds) * 100), 100);
  if (pct <= 0) return null;
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
      <div className="h-full bg-brand-blue" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SkeletonVideoCard() {
  return (
    <div className="hm-card animate-pulse p-3">
      <div className="h-24 w-full rounded-lg bg-[var(--color-surface-muted)]" />
      <div className="mt-2 h-3.5 w-3/4 rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-[var(--color-surface-muted)]" />
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="hm-card flex animate-pulse items-center gap-3 p-3">
      <div className="h-12 w-16 flex-none rounded-lg bg-[var(--color-surface-muted)]" />
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-1.5 h-3 w-1/3 rounded bg-[var(--color-surface-muted)]" />
      </div>
    </div>
  );
}

export function ErrorCard({ title = "Unable to load videos.", subtitle = "Please try again.", onRetry }) {
  return (
    <div className="hm-card p-4">
      <p className="text-sm text-brand-red">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-bold text-brand-blue">
          Retry
        </button>
      )}
    </div>
  );
}

// items: [{ label, href? }] — the last entry (current page) has no href.
// Desktop shows the full trail; mobile collapses to just the immediate
// parent so there's always a real, contextual way back that isn't
// browser-history-dependent (unlike Header's own generic back arrow).
export function VideoBreadcrumb({ items }) {
  const parent = items.length > 1 ? items[items.length - 2] : null;
  return (
    <>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-[var(--color-text-muted)] md:flex">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-blue hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-[var(--color-text)]">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      {parent && (
        <Link href={parent.href} className="flex items-center gap-1 text-xs font-semibold text-brand-blue md:hidden">
          ← {parent.label}
        </Link>
      )}
    </>
  );
}
