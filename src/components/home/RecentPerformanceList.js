"use client";

import Link from "next/link";

const EXAM_TYPE_LABEL = { qbank: "Question Bank", daily: "Daily Test", mock: "Mock Test", grand: "Grand Test", pyq: "Past Year Qs" };

function relativeDate(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function RecentPerformanceList({ attempts }) {
  const recent = (attempts || []).filter((a) => a.status === "submitted").slice(0, 4);

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Recent Performance</p>
        <Link href="/performance" className="text-xs font-bold text-brand-blue">
          View All
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">No attempts yet — take a test to see your results here.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {recent.map((a) => {
            const accuracy = Math.max(0, Math.min(100, Math.round(a.accuracy)));
            return (
              <Link key={a.id} href={`/tests/result/${a.id}`} className="block">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[var(--color-text)]">{a.test_title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {EXAM_TYPE_LABEL[a.exam_type] || "Test"} · {relativeDate(a.start_time)}
                    </p>
                  </div>
                  <span className="flex-none text-xs font-extrabold text-[var(--color-text)]">{accuracy}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div className="h-full rounded-full bg-brand-blue" style={{ width: `${accuracy}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
