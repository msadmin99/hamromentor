"use client";

import Link from "next/link";

export default function Recommendations({ recommendations }) {
  if (!recommendations) return null;

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">💡 Smart Suggestions</p>
        <span className="text-[10px] text-[var(--color-text-muted)]">Rule-based, from your own data</span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {recommendations.suggestions.map((s, i) => (
          <div key={i} className="rounded-xl border border-dashed border-[var(--color-border)] p-3">
            <p className="text-sm text-[var(--color-text)]">{s.message}</p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {s.suggested_video_id && (
                <Link href={`/videos/${s.suggested_video_id}`} className="text-xs font-bold text-brand-blue">
                  Watch suggested video →
                </Link>
              )}
              {s.suggested_test_id && (
                <Link href={`/tests/${s.suggested_test_id}`} className="text-xs font-bold text-brand-blue">
                  Practice this subject →
                </Link>
              )}
              {s.type === "take_mock_test" && (
                <Link href="/mock-test" className="text-xs font-bold text-brand-blue">
                  Browse Mock Tests →
                </Link>
              )}
            </div>
          </div>
        ))}
        {recommendations.suggestions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No suggestions right now — you&apos;re doing great!</p>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-[var(--color-surface-muted)] p-3">
        <p className="text-xs font-semibold text-[var(--color-text)]">
          Suggested daily question goal: {recommendations.suggested_daily_question_goal}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Based on your recent 7-day average.</p>
      </div>
    </div>
  );
}
