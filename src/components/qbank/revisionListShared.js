"use client";

// Shared by QBank Bookmarks and Mistakes (Phase D, Area 1) — both pages
// list Question rows from the same QuestionSerializer shape
// (mastery_status/is_bookmarked always present, see
// academics/serializers.py) and needed the same three small pieces, so
// they're defined once here instead of copy-pasted into both pages.

export const MASTERY_META = {
  weak: { label: "Weak", emoji: "🔴", className: "bg-brand-red-light text-brand-red" },
  need_practice: { label: "Need Practice", emoji: "🟠", className: "bg-warning-soft text-amber-700" },
  learning: { label: "Learning", emoji: "🔵", className: "bg-info-soft text-info" },
  mastered: { label: "Mastered", emoji: "🟢", className: "bg-brand-green-light text-brand-green" },
  // "new" is intentionally not in this map — a question with no real
  // mastery signal yet would just be visual noise on a list of many
  // questions (Bookmarks/Mistakes, the two existing consumers of this
  // map). QBank 2.0 Phase 2D: QuestionSolver shows "🆕 New" for this case
  // itself, locally, rather than adding it here and changing what those
  // two existing list pages render for every never-attempted question.
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
