"use client";

function SubjectPill({ subject, tone }) {
  const styles =
    tone === "good"
      ? "bg-brand-green-light text-brand-green"
      : "bg-brand-red-light text-brand-red";
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles}`}>
      {subject.subject_name} · {subject.accuracy}%
    </span>
  );
}

export default function StrengthsWeaknesses({ data }) {
  if (!data) return null;

  const traits = [];
  if (data.consistent_scores) traits.push("Consistent scores across recent mocks");
  if (data.fast_response) traits.push("Fast response time");
  if (data.slow_response) traits.push("Slower than average response time");

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Strengths & Weaknesses</p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Strong Areas</p>
          <div className="flex flex-wrap gap-2">
            {data.strong_subjects.map((s) => (
              <SubjectPill key={s.subject_id} subject={s} tone="good" />
            ))}
            {data.strong_subjects.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">Keep practicing to surface your strong subjects.</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Weak Areas</p>
          <div className="flex flex-wrap gap-2">
            {data.weak_subjects.map((s) => (
              <SubjectPill key={s.subject_id} subject={s} tone="bad" />
            ))}
            {data.weak_subjects.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">No clear weak spots yet — keep going!</p>
            )}
          </div>
        </div>
      </div>

      {data.high_negative_marking_subjects.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Highest Negative Marking Impact
          </p>
          <div className="flex flex-wrap gap-2">
            {data.high_negative_marking_subjects.map((s) => (
              <span key={s.subject_id} className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800">
                {s.subject_name} · −{s.marks_lost} marks
              </span>
            ))}
          </div>
        </div>
      )}

      {traits.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {traits.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
