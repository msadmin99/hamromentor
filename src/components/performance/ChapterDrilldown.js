"use client";

const CONFIDENCE_STYLES = {
  strong: "bg-brand-green-light text-brand-green",
  moderate: "bg-yellow-100 text-yellow-800",
  needs_improvement: "bg-brand-red-light text-brand-red",
  not_started: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

const CONFIDENCE_LABELS = {
  strong: "Strong",
  moderate: "Moderate",
  needs_improvement: "Needs Improvement",
  not_started: "Not Started",
};

const MASTERY_STYLES = {
  mastered: "bg-brand-green text-white",
  strong: "bg-brand-green-light text-brand-green",
  average: "bg-yellow-100 text-yellow-800",
  weak: "bg-brand-red-light text-brand-red",
  not_started: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

const MASTERY_LABELS = {
  mastered: "Mastered",
  strong: "Strong",
  average: "Average",
  weak: "Weak",
  not_started: "Not Started",
};

export default function ChapterDrilldown({ subjectName, data, loading, onClose }) {
  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Chapter-wise Analysis — {subjectName}</p>
        <button onClick={onClose} className="text-xs font-semibold text-brand-blue">
          Close
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && data && (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Chapter</th>
                  <th className="px-3 py-2">Completion</th>
                  <th className="px-3 py-2">Accuracy</th>
                  <th className="px-3 py-2">Questions Remaining</th>
                  <th className="px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.chapters.map((c) => (
                  <tr key={c.chapter_id}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[var(--color-text)]">{c.chapter_name}</td>
                    <td className="px-3 py-2.5">{c.completion_percent}%</td>
                    <td className="px-3 py-2.5">{c.accuracy}%</td>
                    <td className="px-3 py-2.5">{c.questions_remaining}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${CONFIDENCE_STYLES[c.confidence]}`}>
                        {CONFIDENCE_LABELS[c.confidence]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.chapters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[var(--color-text-muted)]">
                      No chapters found for this subject.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Topic Mastery</p>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((t) => (
              <span
                key={t.topic_id}
                title={`${t.accuracy}% accuracy across ${t.attempted} attempts`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${MASTERY_STYLES[t.mastery]}`}
              >
                {t.topic_name} · {MASTERY_LABELS[t.mastery]}
              </span>
            ))}
            {data.topics.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No topics tagged for this subject.</p>}
          </div>
        </>
      )}
    </div>
  );
}
