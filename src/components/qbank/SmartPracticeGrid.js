"use client";

import Link from "next/link";

// Replaces the old separate SmartPractice.js (icon tiles, no counts) and
// StatusCards.js (counts, different tile set/style) with one grid matching
// every count to a real /questions/dashboard/ field — never fabricated.
// Random Practice has no meaningful count (it's a mix of everything), so it
// shows a description instead, matching the reference design.
const TILES = [
  { key: "need_practice", label: "Needs Practice", icon: "🎯", status: "need_practice" },
  { key: "new", label: "New Questions", icon: "🆕", status: "new" },
  { key: "incorrect", label: "Retry Mistakes", icon: "🔁", status: "incorrect" },
  { key: "need_revision", label: "Due for Review", icon: "🗓️", status: "need_revision" },
  { key: "bookmarked", label: "Bookmarked", icon: "⭐", status: "bookmarked" },
  { key: "random", label: "Random Practice", icon: "🎲", status: null },
];

function hrefFor(status) {
  return status ? `/qbank/practice?status=${status}&auto=1` : "/qbank/practice?auto=1";
}

export default function SmartPracticeGrid({ stats, loading }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Smart Practice</p>
          <p className="text-xs text-[var(--color-text-muted)]">Practice what matters most</p>
        </div>
        <Link href="/qbank/practice" className="flex-none text-xs font-bold text-brand-blue">
          More options →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TILES.map((t) => {
          const count = stats && t.status ? stats[t.key] : null;
          return (
            <Link
              key={t.key}
              href={hrefFor(t.status)}
              className="hm-card flex items-center gap-2.5 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-lg" aria-hidden="true">
                {t.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-[var(--color-text)]">{t.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t.status === null
                    ? "Mix of all topics"
                    : loading || !stats
                      ? "…"
                      : `${count ?? 0} question${count === 1 ? "" : "s"}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
