"use client";

import Illustration from "./Illustration";

function StatItem({ icon, value, label }) {
  return (
    <div className="flex flex-1 items-center gap-2.5">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-marketing-bar)]/10 text-base">
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-lg font-extrabold text-[var(--color-navy)]">{value}</p>
        <p className="truncate text-[11px] text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

// Illustration + the 4-stat bar (Available / Attempted / Upcoming / Reviewed),
// composed together since they always appear side by side at the top of a
// test-listing page.
export default function PlatformStats({ examType, typeLabel, stats }) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <Illustration examType={examType} />
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 sm:gap-x-6">
        <StatItem icon="📄" value={stats.available} label={`${typeLabel} Available`} />
        <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
        <StatItem icon="✅" value={stats.attempted} label="Tests Attempted" />
        <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
        <StatItem icon="🗓️" value={stats.upcoming} label="Upcoming (Scheduled)" />
        <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
        <StatItem icon="📖" value={stats.reviewed} label="Test Reviewed" />
      </div>
    </div>
  );
}
