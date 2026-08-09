"use client";

const FEATURES = [
  { key: "qbank", icon: "📚", label: "Question Bank Access" },
  { key: "daily_test", icon: "📅", label: "Daily Test Access" },
  { key: "mock_test", icon: "🎁", label: "Mock Test Access" },
  { key: "video", icon: "🎥", label: "Video Lectures" },
];

export default function PlanFeatures({ subscriptions, courseNames }) {
  const active = new Set(subscriptions.filter((s) => s.is_current).map((s) => s.product_type));

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Current Plan Details</p>
      <div className="mt-3">
        <p className="text-xs text-[var(--color-text-muted)]">Accessible courses</p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
          {courseNames.length > 0 ? courseNames.join(", ") : "None yet"}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.key}
            className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold ${
              active.has(f.key)
                ? "border-brand-green bg-brand-green-light text-brand-green"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            <span>{active.has(f.key) ? "✅" : "⭕"}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
