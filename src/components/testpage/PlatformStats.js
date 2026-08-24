"use client";

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

// The 4-stat bar (Available / Attempted / Upcoming / Reviewed) shown at the
// top of a test-listing page, right under TestPageHero. Deliberately no
// repeat of the exam-type icon here — TestPageHero already shows it once,
// large; showing it again here just duplicated the same emoji right below
// itself with nothing tying the two together.
export default function PlatformStats({ typeLabel, stats }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 sm:gap-x-6">
      <StatItem icon="📄" value={stats.available} label={`${typeLabel} Available`} />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="✅" value={stats.attempted} label="Tests Attempted" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="🗓️" value={stats.upcoming} label="Upcoming (Scheduled)" />
      <span className="hidden h-9 w-px flex-none bg-[var(--color-border)] sm:block" />
      <StatItem icon="📖" value={stats.reviewed} label="Test Reviewed" />
    </div>
  );
}
