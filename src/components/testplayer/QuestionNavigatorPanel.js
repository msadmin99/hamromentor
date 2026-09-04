"use client";

import { useState } from "react";

const LEGEND = [
  { key: "answered", label: "Answered", dot: "bg-brand-green" },
  { key: "unanswered", label: "Unanswered", dot: "border border-[var(--color-border)]" },
  { key: "current", label: "Current", dot: "border-2 border-brand-blue" },
  { key: "review", label: "Review", dot: "bg-warning" },
];

function questionState({ q, answers, marked, currentQuestionId }) {
  if (q.id === currentQuestionId) return "current";
  if (marked[q.id]) return "review";
  if (answers[q.id] != null) return "answered";
  return "unanswered";
}

const STATE_CLASSES = {
  answered: "bg-brand-green text-white",
  review: "bg-warning text-white",
  current: "border-2 border-brand-blue text-brand-blue",
  unanswered: "border border-[var(--color-border)] text-[var(--color-text-muted)]",
};

/** The actual fix for the old "oversized navigator" (a full-width,
 * always-expanded, aspect-square grid of every question dumped into the page
 * flow): compact fixed-size buttons in a height-capped scroll container, a
 * legend, and a Jump-to-Question input. Used both as the desktop collapsible
 * sidebar and inside Drawer.js as the mobile bottom sheet — same component,
 * no separate markup to keep in sync. */
export default function QuestionNavigatorPanel({ questions, answers, marked, currentQuestionId, onJump, answeredCount, compact = false }) {
  const [jumpValue, setJumpValue] = useState("");

  function handleJump(e) {
    e.preventDefault();
    const n = Number(jumpValue);
    if (n >= 1 && n <= questions.length) {
      onJump(n - 1);
      setJumpValue("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--color-text)]">Questions</p>
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">
            {answeredCount} / {questions.length}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-muted)]">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 flex-none rounded-full ${l.dot}`} aria-hidden="true" />
            {l.label}
          </span>
        ))}
      </div>

      <div className="grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-6" role="list" aria-label="Question navigator">
        {questions.map((q, i) => {
          const state = questionState({ q, answers, marked, currentQuestionId });
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              aria-current={state === "current" ? "true" : undefined}
              aria-label={`Question ${i + 1}${state !== "unanswered" && state !== "current" ? `, ${state}` : ""}`}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-xs font-bold transition ${STATE_CLASSES[state]}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleJump} className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={questions.length}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder="Jump to #"
          aria-label="Jump to question number"
          className="hm-input flex-1 text-sm"
        />
        <button type="submit" className="flex-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold text-[var(--color-text)]">
          Go
        </button>
      </form>
    </div>
  );
}
