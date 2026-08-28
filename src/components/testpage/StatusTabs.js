"use client";

const TABS = [
  { key: "all", label: "All Tests" },
  { key: "not_attempted", label: "Not Attempted" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

/** Compact status tabs replacing the old free-form search/filter bar — Mock
 * Test is a catalog of predefined exams, not a Question Bank, so filtering
 * by real completion status (not subject/topic search) is the right axis.
 * Counts are real, computed from the already-fetched test list. */
export default function StatusTabs({ value, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
      {TABS.map((t) => {
        const count = counts?.[t.key === "all" ? "all" : t.key === "not_attempted" ? "notAttempted" : t.key === "in_progress" ? "inProgress" : "completed"];
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-brand-blue text-white" : "bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            } border border-[var(--color-border)]`}
          >
            {t.label}
            {count != null && <span className={`ml-1.5 ${active ? "text-white/80" : "text-[var(--color-text-muted)]"}`}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
