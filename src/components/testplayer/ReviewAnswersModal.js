"use client";

import Drawer from "@/components/Drawer";

const STATE_META = {
  answered: { label: "Answered", className: "bg-brand-green-light text-brand-green" },
  review: { label: "Marked for Review", className: "bg-warning-soft text-amber-700" },
  unanswered: { label: "Unanswered", className: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" },
};

function stateFor(q, answers, marked) {
  if (marked[q.id]) return "review";
  if (answers[q.id] != null) return "answered";
  return "unanswered";
}

/** Pre-submit summary — real counts/status from the same answers/marked
 * state the navigator uses, with per-item jump-back. Replaces the old
 * direct, unconfirmed submit-on-click. */
export default function ReviewAnswersModal({ open, onClose, questions, answers, marked, onJump, onConfirmSubmit, submitting }) {
  const answeredCount = questions.filter((q) => answers[q.id] != null).length;
  const reviewCount = questions.filter((q) => marked[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Review Answers"
      maxWidth="sm:max-w-lg"
      footer={
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text)]">
            Continue Test
          </button>
          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-brand-red py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-brand-green-light px-3 py-1 text-xs font-bold text-brand-green">{answeredCount} answered</span>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--color-text-muted)]">
          {unansweredCount} unanswered
        </span>
        {reviewCount > 0 && (
          <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-bold text-amber-700">{reviewCount} marked for review</span>
        )}
      </div>
      {unansweredCount > 0 && (
        <p className="mb-3 rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">
          You have {unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"}. You can still submit, or go back to answer them.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {questions.map((q, i) => {
          const state = stateFor(q, answers, marked);
          const meta = STATE_META[state];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                onJump(i);
                onClose();
              }}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--color-surface-muted)]"
            >
              <span className="min-w-0 truncate text-sm text-[var(--color-text)]">
                Q{i + 1}. {(q.text || "").replace(/<[^>]+>/g, "").slice(0, 60) || "Question"}
              </span>
              <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.className}`}>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}
