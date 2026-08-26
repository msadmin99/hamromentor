export default function PerformanceMessage({ statsAvailable, correctPercent }) {
  if (!statsAvailable) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">
        Not enough attempts yet to show how other students did on this one.
      </p>
    );
  }
  return (
    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
      {correctPercent}% of students got this right.
    </p>
  );
}
