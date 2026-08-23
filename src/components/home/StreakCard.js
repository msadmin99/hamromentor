export default function StreakCard({ days }) {
  return (
    <div className="hm-card flex items-center justify-between p-4">
      <div>
        <p className="flex items-center gap-1 text-sm font-bold text-[var(--color-text)]">
          <span aria-hidden="true">🔥</span> Streak
        </p>
        <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">{days ?? 0}</p>
        <p className="text-xs text-[var(--color-text-muted)]">Days in a row</p>
      </div>
      <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-orange-50 text-3xl" aria-hidden="true">
        🔥
      </span>
    </div>
  );
}
