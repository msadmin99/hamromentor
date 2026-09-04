"use client";

// Shared by QBank Bookmarks and Mistakes (Phase D, Area 1) — both pages
// list Question rows from the same QuestionSerializer shape
// (mastery_status/is_bookmarked always present, see
// academics/serializers.py) and needed the same three small pieces, so
// they're defined once here instead of copy-pasted into both pages.

export const MASTERY_META = {
  weak: { label: "Weak", className: "bg-brand-red-light text-brand-red" },
  need_practice: { label: "Need Practice", className: "bg-warning-soft text-amber-700" },
  learning: { label: "Learning", className: "bg-info-soft text-info" },
  mastered: { label: "Mastered", className: "bg-brand-green-light text-brand-green" },
  // "new" is intentionally not in this map — a question with no real
  // mastery signal yet would just be visual noise, not information.
};

export function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, " ");
}

export function SkeletonCard() {
  return (
    <div className="hm-card flex animate-pulse items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="h-3 w-24 rounded-full bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-3.5 w-full rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-1.5 h-3.5 w-2/3 rounded bg-[var(--color-surface-muted)]" />
      </div>
    </div>
  );
}
