"use client";

import Link from "next/link";

export default function UpgradeBanner() {
  return (
    <div
      className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] p-4 sm:flex-row"
      style={{ background: "linear-gradient(120deg, rgba(87,180,206,0.08) 0%, rgba(34,76,90,0.08) 100%)" }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-marketing-bar)]/15 text-lg">
          ⭐
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Want Unlimited Access?</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Upgrade to PRO and unlock all tests with detailed solutions & performance insights.
          </p>
        </div>
      </div>
      <Link
        href="/plans"
        className="flex-none rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md"
        style={{ background: "linear-gradient(120deg, var(--color-marketing-bar) 0%, var(--color-exam-card) 100%)" }}
      >
        👑 Upgrade Now
      </Link>
    </div>
  );
}
