"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useDialogA11y } from "@/lib/useDialogA11y";
import { FlagIcon, WarningTriangleIcon } from "./icons";

const REASONS = [
  { key: "incorrect_answer", label: "Incorrect answer" },
  { key: "incorrect_explanation", label: "Incorrect explanation" },
  { key: "ambiguous", label: "Ambiguous question" },
  { key: "typo", label: "Typographical error" },
  { key: "outdated", label: "Outdated information" },
  { key: "poor_image", label: "Poor image" },
  { key: "other", label: "Other" },
];

function ReportQuestionModal({ questionId, onClose }) {
  // Accessibility pass: Escape, focus trap and focus return, shared with
  // Drawer so this copy of the same shell cannot drift away from it.
  const panelRef = useDialogA11y(true, onClose);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/questions/${questionId}/report/`, { reason, comment });
      setDone(true);
    } catch {
      setError("Couldn't submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-question-title"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:max-h-[85dvh] sm:max-w-sm sm:rounded-2xl"
      >
        {done ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-2xl">✓</p>
            <p className="text-sm font-bold text-[var(--color-text)]">Thanks for the report</p>
            <p className="text-xs text-[var(--color-text-muted)]">Our team will review this question.</p>
            <button onClick={onClose} className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="report-question-title" className="text-base font-bold text-[var(--color-text)]">Report this question</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">What's wrong with it?</p>

            <div className="mt-3 flex flex-col gap-1.5">
              {REASONS.map((r) => (
                <label key={r.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm">
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                      reason === r.key ? "border-brand-blue" : "border-[var(--color-border)]"
                    }`}
                  >
                    {reason === r.key && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
                  </span>
                  <span className="text-[var(--color-text)]">{r.label}</span>
                  <input type="radio" name="report-reason" className="hidden" checked={reason === r.key} onChange={() => setReason(r.key)} />
                </label>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add details (optional)"
              rows={3}
              className="hm-input mt-3 w-full resize-none"
            />

            {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}

            <button
              onClick={submit}
              disabled={!reason || submitting}
              className="mt-4 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** variant="icon" (default): compact flag icon for header rows.
 * variant="link": text-labeled "Report error" link matching the img6
 * reference's bottom-of-card placement — same submit logic either way. */
export default function ReportQuestionButton({ questionId, className = "", variant = "icon" }) {
  const [open, setOpen] = useState(false);

  if (variant === "link") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center gap-1.5 text-xs font-semibold text-brand-red ${className}`}
        >
          <WarningTriangleIcon />
          Report error
        </button>
        {open && <ReportQuestionModal questionId={questionId} onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report this question"
        className={`flex-none text-[var(--color-text-muted)] transition hover:text-brand-red ${className}`}
      >
        <FlagIcon />
      </button>
      {open && <ReportQuestionModal questionId={questionId} onClose={() => setOpen(false)} />}
    </>
  );
}
