import { FlameIcon } from "@/components/icons";

export default function StreakCard({ days }) {
  return (
    <div className="hm-card flex items-center justify-between p-4">
      <div>
        <p className="flex items-center gap-1 text-sm font-bold text-[var(--color-text)]">
          <FlameIcon className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" /> Streak
        </p>
        <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">{days ?? 0}</p>
        <p className="text-xs text-[var(--color-text-muted)]">Days in a row</p>
      </div>
      <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-orange-50 text-orange-500" aria-hidden="true">
        <FlameIcon className="h-7 w-7" />
      </span>
    </div>
  );
}
