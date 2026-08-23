"use client";

import Link from "next/link";

const ACTIONS = [
  { key: "new", label: "New Questions", icon: "🆕", params: "status=new" },
  { key: "weak", label: "Weak Questions", icon: "🎯", params: "status=weak" },
  { key: "incorrect", label: "Retry Incorrect", icon: "🔁", params: "status=incorrect" },
  { key: "bookmarked", label: "Bookmarked", icon: "⭐", params: "status=bookmarked" },
  { key: "need_revision", label: "Revision Due", icon: "🗓️", params: "status=need_revision" },
  { key: "random", label: "Random Practice", icon: "🎲", params: "" },
];

/** One-tap practice entry points — each just deep-links into /qbank/practice
 * with the filter pre-set and auto=1, so it starts immediately without the
 * student configuring anything (the manual configurator lives at the same
 * route, minus auto=1). */
export default function SmartPractice() {
  return (
    <section>
      <p className="text-sm font-bold text-[var(--color-text)]">Smart Practice</p>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">Practice exactly what needs your attention.</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link
            key={a.key}
            href={`/qbank/practice?${a.params}${a.params ? "&" : ""}auto=1`}
            className="hm-card flex items-center gap-2.5 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-xl" aria-hidden="true">{a.icon}</span>
            <span className="text-sm font-bold text-[var(--color-text)]">{a.label}</span>
          </Link>
        ))}
      </div>
      <Link
        href="/qbank/practice"
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-brand-blue"
      >
        Topic-wise / Create Practice →
      </Link>
    </section>
  );
}
