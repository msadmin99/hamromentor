"use client";

import AccuracyRing from "@/components/qbank/AccuracyRing";

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

/** Desktop-only right sidebar: a compact progress ring (reusing
 * components/qbank/AccuracyRing.js) + Quick Info. "Positive/Negative Mark"
 * are the CURRENT question's own real marks/negative_marks fields (this
 * schema has per-question marking, not a single test-wide constant) rather
 * than a fabricated test-wide figure. */
export default function TestProgressPanel({ answeredCount, totalQuestions, remaining, currentQuestion }) {
  const pct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="hm-card p-4">
        <p className="text-sm font-bold text-[var(--color-text)]">Test Progress</p>
        <div className="mt-3 flex items-center gap-4">
          <AccuracyRing percent={pct} label="Completed" size={80} stroke={8} />
          <div>
            <p className="text-lg font-extrabold text-[var(--color-text)]">
              {answeredCount} / {totalQuestions}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Questions answered</p>
          </div>
        </div>
      </div>

      <div className="hm-card p-4">
        <p className="text-sm font-bold text-[var(--color-text)]">Quick Info</p>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Time Left</span>
            <span className="font-bold text-[var(--color-text)]">{formatTime(remaining)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Total Questions</span>
            <span className="font-bold text-[var(--color-text)]">{totalQuestions}</span>
          </div>
          {currentQuestion && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Positive Mark</span>
                <span className="font-bold text-brand-green">+{currentQuestion.marks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Negative Mark</span>
                <span className="font-bold text-brand-red">-{currentQuestion.negative_marks}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
