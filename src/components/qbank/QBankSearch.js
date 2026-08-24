"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import RichContent from "@/components/RichContent";
import { SearchIcon } from "@/components/icons";
import { api } from "@/lib/api";

const TABS = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "incorrect", label: "Incorrect" },
  { key: "bookmarked", label: "Bookmarked" },
  { key: "weak", label: "Weak" },
];

const STATUS_LABELS = {
  mastered: "Mastered", weak: "Weak", need_practice: "Need Practice", learning: "Learning", new: "New",
};

function QuestionResultCard({ q }) {
  return (
    <Link
      href={`/qbank/question/${q.id}`}
      className="hm-card flex flex-col gap-1.5 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-blue">
        {q.subject_name}
        {q.chapter_name ? ` · ${q.chapter_name}` : ""}
      </p>
      <div className="line-clamp-2 text-sm text-[var(--color-text)]">
        <RichContent html={q.text} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
        {q.instructor_difficulty && (
          <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 capitalize text-[var(--color-text-muted)]">
            {q.instructor_difficulty.replace("_", " ")}
          </span>
        )}
        {q.is_incorrect && <span className="rounded bg-brand-red-light px-1.5 py-0.5 text-brand-red">Previously Incorrect</span>}
        {q.mastery_status && q.mastery_status !== "new" && !q.is_incorrect && (
          <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[var(--color-text-muted)]">
            {STATUS_LABELS[q.mastery_status] || q.mastery_status}
          </span>
        )}
        {q.is_bookmarked && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">⭐ Bookmarked</span>}
      </div>
    </Link>
  );
}

export default function QBankSearch() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("");
  const [results, setResults] = useState(null);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef(null);

  function runSearch() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ page_size: "20" });
    if (query.trim()) params.set("search", query.trim());
    if (tab) params.set("status", tab);
    api
      .get(`/questions/browse/?${params.toString()}`)
      .then((data) => {
        setResults(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!query.trim() && !tab) {
      setResults(null);
      setCount(null);
      return undefined;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSearch, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tab]);

  const active = Boolean(query.trim() || tab);

  return (
    <section>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          id="qbank-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, topics, chapters…"
          className="hm-input w-full pl-10"
          aria-label="Search the Question Bank"
        />
      </div>

      {active && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="hm-scrollbar-none flex gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  tab === t.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-[var(--color-text-muted)]">Searching…</p>}

          {!loading && error && (
            <div className="hm-card p-4">
              <p className="text-sm text-brand-red">Something went wrong searching.</p>
              <button type="button" onClick={runSearch} className="mt-2 text-xs font-bold text-brand-blue">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && results && (
            <>
              {count !== null && <p className="text-xs text-[var(--color-text-muted)]">{count} question{count === 1 ? "" : "s"} found</p>}
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                  No questions found. Try another keyword or adjust your filters.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {results.map((q) => (
                    <QuestionResultCard key={q.id} q={q} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
