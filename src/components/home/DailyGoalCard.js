"use client";

import RadialProgress from "./RadialProgress";

/** Real data only: questions_today comes from academics.QuestionEvent
 * (every QBank + test answer, platform-wide); goal is the same rule-based
 * suggested_daily_question_goal already used by the QBank Recommended-for-You
 * panel — never a fabricated number. */
export default function DailyGoalCard({ completed, goal }) {
  const done = completed ?? 0;
  const target = goal || 10;
  const pct = Math.round((done / target) * 100);

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Daily Goal</p>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <RadialProgress percent={pct} size={80} strokeWidth={8}>
          <div className="text-center">
            <p className="text-base font-extrabold text-[var(--color-text)]">{pct}%</p>
          </div>
        </RadialProgress>
        <div className="leading-tight">
          <p className="text-lg font-extrabold text-[var(--color-text)]">
            {done} <span className="text-sm font-medium text-[var(--color-text-muted)]">/ {target}</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Questions today</p>
        </div>
      </div>
    </div>
  );
}
