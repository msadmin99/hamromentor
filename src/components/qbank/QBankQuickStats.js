"use client";

const STATS_META = [
  { key: "available", icon: "📄", label: "Practice Tests Available", iconBg: "bg-brand-blue/10", fg: "text-brand-blue" },
  { key: "attempted", icon: "✅", label: "Tests Attempted", iconBg: "bg-brand-green-light", fg: "text-brand-green" },
  { key: "upcoming", icon: "🗓️", label: "Upcoming (Scheduled)", iconBg: "bg-orange-100", fg: "text-orange-600" },
  { key: "reviewed", icon: "📖", label: "Test Reviewed", iconBg: "bg-purple-100", fg: "text-purple-600" },
];

/** Same data as testpage/PlatformStats (computePlatformStats) — a separate,
 * more premium presentation local to the QBank page so the shared
 * PlatformStats component (used by mock/daily/grand/pyq pages too) stays
 * untouched. */
export default function QBankQuickStats({ stats }) {
  return (
    <div className="hm-card grid grid-cols-2 gap-y-4 p-4 sm:grid-cols-4 sm:divide-x sm:divide-[var(--color-border)]">
      {STATS_META.map((s) => (
        <div key={s.key} className="flex items-center gap-2.5 sm:pl-4 sm:first:pl-0">
          <span
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-base ${s.iconBg} ${s.fg}`}
            aria-hidden="true"
          >
            {s.icon}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-lg font-extrabold text-[var(--color-text)]">{stats[s.key]}</p>
            <p className="truncate text-[11px] text-[var(--color-text-muted)]">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
