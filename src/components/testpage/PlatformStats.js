"use client";

function StatItem({ icon, value, label, tint }) {
  return (
    <div className="flex flex-1 items-center gap-2.5">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-base ${tint}`}>{icon}</span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-lg font-extrabold text-[var(--color-text)]">{value}</p>
        <p className="truncate text-[11px] text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

// The 4-stat bar (Available / Attempted / Upcoming / Reviewed) shown at the
// top of a test-listing page, right under TestPageHero — same shape/data
// (computePlatformStats) across Daily/Mock/Grand, distinct tinted icon per
// stat matching the reference's colored tiles.
export default function PlatformStats({ typeLabel, stats, loading }) {
  if (loading) {
    return (
      <div className="flex animate-pulse flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2.5">
            <div className="h-10 w-10 flex-none rounded-full bg-[var(--color-surface-muted)]" />
            <div className="h-3.5 w-16 rounded bg-[var(--color-surface-muted)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 sm:gap-x-6">
      <StatItem icon="📄" value={stats.available} label={`${typeLabel} Available`} tint="bg-[var(--color-surface-muted)]" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="✅" value={stats.attempted} label="Tests Attempted" tint="bg-brand-green-light text-brand-green" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="🗓️" value={stats.upcoming} label="Upcoming (Scheduled)" tint="bg-amber-100 text-amber-700" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="📖" value={stats.reviewed} label="Test Reviewed" tint="bg-brand-blue/10 text-brand-blue" />
    </div>
  );
}
