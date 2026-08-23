"use client";

import Link from "next/link";

// Emoji + text label together (never color/emoji alone) — spec requires
// status to never be conveyed by color alone for accessibility.
const CARDS = [
  { key: "new", label: "New", icon: "🔵", status: "new", bg: "bg-sky-50", fg: "text-sky-700" },
  { key: "mastered", label: "Mastered", icon: "🟢", status: "mastered", bg: "bg-brand-green-light", fg: "text-brand-green" },
  { key: "need_practice", label: "Need Practice", icon: "🟠", status: "need_practice", bg: "bg-orange-50", fg: "text-orange-700" },
  { key: "weak", label: "Weak Questions", icon: "🔴", status: "weak", bg: "bg-brand-red-light", fg: "text-brand-red" },
  { key: "bookmarked", label: "Bookmarked", icon: "⭐", status: "bookmarked", bg: "bg-amber-50", fg: "text-amber-700" },
];

export default function StatusCards({ stats }) {
  if (!stats) return null;

  return (
    <section>
      <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Your Question Status</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map((c) => {
          const count = stats[c.key] ?? 0;
          return (
            <Link
              key={c.key}
              href={`/qbank/practice?status=${c.status}&auto=1`}
              className={`hm-card flex flex-col gap-1 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md ${c.bg}`}
            >
              <span className="text-lg" aria-hidden="true">{c.icon}</span>
              <p className={`text-xl font-extrabold ${c.fg}`}>{count}</p>
              <p className="text-xs font-semibold text-[var(--color-text)]">{c.label}</p>
              <p className={`mt-0.5 text-[11px] font-bold ${c.fg}`}>Practice Now →</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
