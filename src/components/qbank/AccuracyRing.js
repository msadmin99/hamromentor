"use client";

/** Shared SVG circular-progress ring — used by NextPracticeCard (per-topic
 * accuracy) and ProgressSummary (overall accuracy) so there's one
 * implementation, not two near-identical ones. */
export default function AccuracyRing({ percent, label = "Accuracy", size = 112, stroke = 10, showLabel = true }) {
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const tone = pct >= 70 ? "var(--color-brand-green, #16a34a)" : pct >= 40 ? "#d97706" : "var(--color-brand-red, #dc2626)";
  // Below ~72px the default text-xl/[10px] pair no longer fits two lines —
  // scale down to a single compact number for small callers (e.g. the
  // per-question performance summary) instead of clipping.
  const compact = size < 72;

  return (
    <div
      className="relative flex flex-none items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${percent == null ? "no data yet" : `${pct}%`}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-muted)" strokeWidth={stroke} />
        {percent != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-extrabold text-[var(--color-text)] ${compact ? "text-xs" : "text-xl"}`}>
          {percent == null ? "—" : `${pct}%`}
        </span>
        {showLabel && !compact && <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{label}</span>}
      </div>
    </div>
  );
}
