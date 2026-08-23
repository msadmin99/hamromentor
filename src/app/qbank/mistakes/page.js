"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";

const SCOPES = [
  { key: "all", label: "All" },
  { key: "recent", label: "Recent" },
  { key: "frequent", label: "Frequently Repeated" },
];

function MistakesContent() {
  const [data, setData] = useState(null);
  const [scope, setScope] = useState("all");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ scope });
    if (subject) params.set("subject", subject);
    api
      .get(`/questions/mistakes/?${params.toString()}`)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [scope, subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const bySubject = data?.by_subject || [];
  const results = data?.results || [];
  const totalMistakes = bySubject.reduce((sum, s) => sum + s.count, 0);

  return (
    <AppShell>
      <Header title="My Mistakes" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card p-4">
          <p className="text-sm font-bold text-[var(--color-text)]">My Mistakes</p>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Review questions you previously got wrong and turn mistakes into marks.
          </p>

          {!loading && !error && bySubject.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {bySubject.map((row) => (
                <button
                  key={row.subject_id}
                  type="button"
                  onClick={() => setSubject(subject === String(row.subject_id) ? "" : String(row.subject_id))}
                  aria-pressed={subject === String(row.subject_id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    subject === String(row.subject_id) ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                  }`}
                >
                  <span className="font-semibold">{row.subject_name}</span>
                  <span className="font-bold">{row.count}</span>
                </button>
              ))}
            </div>
          )}

          <Link
            href={`/qbank/practice?status=incorrect${subject ? `&subject=${subject}` : ""}&auto=1`}
            className="mt-4 block w-full rounded-xl bg-brand-blue py-2.5 text-center text-sm font-bold text-white transition hover:brightness-110"
          >
            Practice My Mistakes {totalMistakes > 0 ? `(${totalMistakes})` : ""}
          </Link>
        </div>

        <div>
          <div className="hm-scrollbar-none flex gap-1.5 overflow-x-auto">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  scope === s.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

            {!loading && error && (
              <div className="hm-card p-4">
                <p className="text-sm text-brand-red">Couldn&apos;t load your mistakes right now.</p>
                <button type="button" onClick={load} className="mt-2 text-xs font-bold text-brand-blue">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="hm-card p-6 text-center">
                <p className="text-sm font-semibold text-[var(--color-text)]">No mistakes yet</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Great start! You haven&apos;t recorded any incorrect questions yet.
                </p>
              </div>
            )}

            {!loading && !error && results.map((q) => (
              <Link
                key={q.id}
                href={`/qbank/question/${q.id}`}
                className="hm-card flex flex-col gap-1 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                  {q.subject_name}
                  {q.chapter_name ? ` · ${q.chapter_name}` : ""}
                </p>
                <div className="line-clamp-2 text-sm text-[var(--color-text)]">
                  <RichContent html={q.text} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function MistakesPage() {
  return (
    <RequireAuth>
      <MistakesContent />
    </RequireAuth>
  );
}
