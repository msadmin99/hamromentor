"use client";

function Stat({ label, value, tint }) {
  return (
    <div className="hm-card p-3">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${tint || "text-[var(--color-text)]"}`}>{value}</p>
    </div>
  );
}

const NOT_TRACKED_LABELS = {
  reattempts: "Reattempted questions",
  correct_after_revision: "Correct after revision",
  difficulty_breakdown: "Easy / Medium / Hard breakdown",
};

export default function QuestionAnalytics({ questions }) {
  if (!questions) return null;

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Question Analytics</p>

      <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">From Exams & Tests</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Answered" value={questions.exam_answered} />
        <Stat label="Correct" value={questions.exam_correct} tint="text-brand-green" />
        <Stat label="Incorrect" value={questions.exam_incorrect} tint="text-brand-red" />
        <Stat label="Skipped" value={questions.exam_skipped} />
        <Stat label="Flagged for Review" value={questions.exam_flagged_for_review} />
      </div>

      <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">From QBank Practice</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Solved" value={questions.qbank_solved} />
        <Stat label="Correct" value={questions.qbank_correct} tint="text-brand-green" />
        <Stat label="Bookmarked" value={questions.qbank_bookmarked} />
      </div>

      {questions.not_tracked?.length > 0 && (
        <p className="mt-4 text-[11px] text-[var(--color-text-muted)]">
          Not tracked yet: {questions.not_tracked.map((k) => NOT_TRACKED_LABELS[k] || k).join(", ")}.
        </p>
      )}
    </div>
  );
}
