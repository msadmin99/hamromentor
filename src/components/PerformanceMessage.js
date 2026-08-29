import AccuracyRing from "./qbank/AccuracyRing";

/** Secondary, compact performance summary shown below the answer options —
 * deliberately small/quiet relative to the question+options above it. */
export default function PerformanceMessage({ statsAvailable, correctPercent, totalResponses }) {
  if (!statsAvailable) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">Not enough responses yet to show how other students did on this one.</p>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-muted)] px-3.5 py-2.5">
      <AccuracyRing percent={correctPercent} label="Correct" size={44} stroke={5} />
      <div className="min-w-0">
        <p className="text-xs font-bold text-[var(--color-text)]">{correctPercent}% of students answered correctly</p>
        {totalResponses != null && (
          <p className="text-[11px] text-[var(--color-text-muted)]">Based on {totalResponses.toLocaleString()} responses</p>
        )}
      </div>
    </div>
  );
}
