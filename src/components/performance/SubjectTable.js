"use client";

import { useMemo, useState } from "react";

const COLUMNS = [
  { key: "subject_name", label: "Subject" },
  { key: "attempted", label: "Attempted" },
  { key: "correct", label: "Correct" },
  { key: "incorrect", label: "Incorrect" },
  { key: "accuracy", label: "Accuracy" },
  { key: "score", label: "Score" },
  { key: "completion_percent", label: "Completion" },
];

function accuracyTint(accuracy, attempted) {
  if (!attempted) return "text-[var(--color-text-muted)]";
  if (accuracy >= 70) return "text-brand-green";
  if (accuracy >= 50) return "text-yellow-600";
  return "text-brand-red";
}

export default function SubjectTable({ subjects, onSelectSubject }) {
  const [sortKey, setSortKey] = useState("accuracy");
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const list = [...(subjects || [])];
    list.sort((a, b) => {
      const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      return sortDir === "asc" ? diff : -diff;
    });
    return list;
  }, [subjects, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="hm-card overflow-x-auto p-4">
      <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Subject-wise Performance</p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-[var(--color-text-muted)]">
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="cursor-pointer whitespace-nowrap px-3 py-2 select-none"
              >
                {c.label} {sortKey === c.key && (sortDir === "asc" ? "↑" : "↓")}
              </th>
            ))}
            <th className="px-3 py-2">Rank</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {sorted.map((s) => (
            <tr
              key={s.subject_id}
              onClick={() => onSelectSubject?.(s.subject_id, s.subject_name)}
              className="cursor-pointer hover:bg-[var(--color-surface-muted)]"
            >
              <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-[var(--color-text)]">{s.subject_name}</td>
              <td className="px-3 py-2.5">{s.attempted}</td>
              <td className="px-3 py-2.5">{s.correct}</td>
              <td className="px-3 py-2.5">{s.incorrect}</td>
              <td className={`px-3 py-2.5 font-bold ${accuracyTint(s.accuracy, s.attempted)}`}>{s.accuracy}%</td>
              <td className="px-3 py-2.5">{s.score}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div className="h-full rounded-full bg-brand-blue" style={{ width: `${s.completion_percent}%` }} />
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">{s.completion_percent}%</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                {s.rank ? `#${s.rank.rank} / ${s.rank.out_of}` : "—"}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-[var(--color-text-muted)]">
                No subject data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
        Click a subject to see its chapter-wise breakdown. Rank compares your accuracy against other students who&apos;ve
        answered at least 5 questions in that subject.
      </p>
    </div>
  );
}
