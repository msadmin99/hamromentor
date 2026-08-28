"use client";

import { useEffect, useRef, useState } from "react";

const DIFFICULTIES = [
  { key: "", label: "Difficulty" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

const STATUSES = [
  { key: "", label: "Status" },
  { key: "available", label: "Available" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

const SORTS = [
  { key: "recommended", label: "Sort by: Recommended" },
  { key: "newest", label: "Sort by: Newest" },
  { key: "questions", label: "Sort by: Most Questions" },
];

/** Search (debounced, server-side via ?search=) + Subject/Difficulty
 * (server-side) + Status/Sort (client-side, filtering/reordering the
 * already-fetched list) — one shared bar used by Daily/Mock Test, copy
 * driven by `examTypeLabel`. */
export default function TestSearchFilterBar({ examTypeLabel, subjects, filters, onChange }) {
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const debounceRef = useRef(null);

  useEffect(() => setSearchDraft(filters.search), [filters.search]);

  function handleSearchInput(value) {
    setSearchDraft(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ search: value }), 300);
  }

  return (
    <div className="hm-card flex flex-col gap-2.5 p-3.5 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <input
          value={searchDraft}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={`Search ${examTypeLabel}…`}
          aria-label={`Search ${examTypeLabel}`}
          className="hm-input pr-8"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true">
          🔍
        </span>
      </div>

      <select
        value={filters.subject}
        onChange={(e) => onChange({ subject: e.target.value })}
        aria-label="Filter by subject"
        className="hm-input w-auto flex-none"
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={filters.difficulty}
        onChange={(e) => onChange({ difficulty: e.target.value })}
        aria-label="Filter by difficulty"
        className="hm-input w-auto flex-none"
      >
        {DIFFICULTIES.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        aria-label="Filter by status"
        className="hm-input w-auto flex-none"
      >
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value })}
        aria-label="Sort tests"
        className="hm-input w-auto flex-none"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
