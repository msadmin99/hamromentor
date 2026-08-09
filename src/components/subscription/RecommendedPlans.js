"use client";

const PRODUCT_LABELS = {
  qbank: "Question Bank",
  daily_test: "Daily Test",
  mock_test: "Mock Test",
  video: "Video Lectures",
};

export default function RecommendedPlans({ subscriptions, courseName, onExplore }) {
  const active = new Set(subscriptions.filter((s) => s.is_current).map((s) => s.product_type));
  const missing = Object.keys(PRODUCT_LABELS).filter((k) => !active.has(k));

  if (missing.length === 0) return null;

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Recommended Plans</p>
        <span className="text-[10px] text-[var(--color-text-muted)]">Based on your current access, not AI</span>
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        You&apos;re enrolled in {courseName || "your course"} but don&apos;t have active access to:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {missing.map((k) => (
          <button
            key={k}
            onClick={() => onExplore(k)}
            className="rounded-full border border-brand-blue px-3 py-1.5 text-xs font-semibold text-brand-blue"
          >
            + {PRODUCT_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}
