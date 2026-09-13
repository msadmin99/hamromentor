"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { BookmarkIcon, SearchIcon } from "@/components/icons";
import { MASTERY_META, SkeletonCard, stripHtml } from "@/components/qbank/revisionListShared";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// Phase D, Area 1b: same /questions/mistakes/?scope=&subject= endpoint,
// same by_subject counts and scope tabs as before. `results` already
// carries topic_name/mastery_status/is_bookmarked — academics/views.py's
// `mistakes` action explicitly sets is_bookmarked_by_user and serializes
// through the same QuestionSerializer /questions/ uses — so the topic
// badge, mastery chip, and bookmark toggle added below are all read
// straight off data this endpoint already returned, same as Area 1a.
// Search is client-side over whatever `results` the server already sent
// for the current scope/subject — it doesn't add a request.
//
// QBank 2.0 Phase 3D/3E — Mistake Bank 2.0:
// - `?course=` is now sent (mistakes() previously had zero course
//   scoping at all — the documented inconsistency vs. Bookmarks).
// - Weak / High Confidence are client-side filters over `results`
//   (mastery_status/confidence are now real, populated fields — see
//   mistakes()'s own fix — not a second backend query).
// - Repeated (incorrect_count >= 2, the same documented threshold
//   academics/views.py uses) replaces the old vague "Frequently
//   Repeated" scope label with the exact number shown per card.
const SCOPES = [
  { key: "all", label: "All" },
  { key: "recent", label: "Recent" },
  { key: "frequent", label: "Repeated" },
];

const REPEATED_MISTAKE_MIN_COUNT = 2; // mirrors academics/views.py's own documented constant

function formatLastAttempted(iso) {
  if (!iso) return null;
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function MistakesContent() {
  const { activeCourse } = useCourse();
  const [data, setData] = useState(null);
  const [scope, setScope] = useState("all");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  // QBank 2.0 Phase 3D: client-side, over already-loaded `results` — both
  // fields are real (mastery_status/confidence, now populated by the
  // mistakes() fix), not a second backend query.
  const [weakOnly, setWeakOnly] = useState(false);
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookmarking, setBookmarking] = useState(null);
  const [localBookmarks, setLocalBookmarks] = useState({}); // id -> bool, overrides data until next load()

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ scope });
    if (subject) params.set("subject", subject);
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/mistakes/?${params.toString()}`)
      .then((d) => {
        setData(d);
        setLocalBookmarks({});
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, subject, activeCourse?.id]);

  // Memoized (not a plain `data?.x || []`) so a null `data` doesn't hand
  // useMemo below a fresh [] reference on every render.
  const bySubject = useMemo(() => data?.by_subject || [], [data]);
  const results = useMemo(() => data?.results || [], [data]);
  const totalMistakes = bySubject.reduce((sum, s) => sum + s.count, 0);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    return results.filter((q) => {
      if (term && !stripHtml(q.text).toLowerCase().includes(term)) return false;
      if (weakOnly && q.mastery_status !== "weak") return false;
      // Confidence Trap: answered incorrectly while self-reporting high
      // confidence — real data (QuestionAttempt.confidence), never a
      // guess. See QuestionAttempt.CONFIDENCE_CHOICES.
      if (highConfidenceOnly && q.confidence !== "confident") return false;
      return true;
    });
  }, [results, search, weakOnly, highConfidenceOnly]);

  async function toggleBookmark(question) {
    const next = !(localBookmarks[question.id] ?? question.is_bookmarked);
    setBookmarking(question.id);
    setLocalBookmarks((b) => ({ ...b, [question.id]: next }));
    try {
      await api.post(`/questions/${question.id}/bookmark/`, { bookmark: next });
    } catch {
      setLocalBookmarks((b) => ({ ...b, [question.id]: !next }));
    } finally {
      setBookmarking(null);
    }
  }

  return (
    <AppShell>
      <Header
        title="My Mistakes"
        subtitle={totalMistakes > 0 ? `${totalMistakes} question${totalMistakes === 1 ? "" : "s"} to review` : "Turn mistakes into marks"}
        showBack
      />
      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Every question you review here is a chance to turn a mistake into a mark on exam day.
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

          {/* QBank 2.0 Phase 3D/3F: client-side filters, only shown once
              there's something to filter — real mastery/confidence data,
              never a fake filter with no backing data. */}
          {!loading && !error && results.length > 0 && (
            <div className="hm-scrollbar-none mt-1.5 flex gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setWeakOnly((v) => !v)}
                aria-pressed={weakOnly}
                className={`flex-none rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  weakOnly ? "bg-brand-red text-white" : "bg-brand-red-light text-brand-red"
                }`}
              >
                🔴 Weak
              </button>
              <button
                type="button"
                onClick={() => setHighConfidenceOnly((v) => !v)}
                aria-pressed={highConfidenceOnly}
                className={`flex-none rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  highConfidenceOnly ? "bg-amber-600 text-white" : "bg-warning-soft text-amber-700"
                }`}
              >
                ⚠️ Confidence Trap
              </button>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="relative mt-3">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search these questions…"
                className="hm-input pl-9"
                aria-label="Search questions to review"
              />
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {loading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

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

            {!loading && !error && results.length > 0 && filteredResults.length === 0 && (
              <div className="hm-card p-6 text-center">
                <p className="text-sm font-semibold text-[var(--color-text)]">No matches</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {weakOnly || highConfidenceOnly ? "Try a different filter." : "Try a different search term."}
                </p>
              </div>
            )}

            {!loading && !error && filteredResults.map((q) => {
              const mastery = MASTERY_META[q.mastery_status];
              const bookmarked = localBookmarks[q.id] ?? q.is_bookmarked;
              // QBank 2.0 Phase 3D: repeated/confidence-trap badges — both
              // read straight off real QuestionAttempt fields the
              // mistakes() fix now exposes (incorrect_count/confidence),
              // never a guess.
              const isRepeated = (q.incorrect_count ?? 0) >= REPEATED_MISTAKE_MIN_COUNT;
              const isConfidenceTrap = q.confidence === "confident";
              const lastAttempted = formatLastAttempted(q.last_attempted_at);
              return (
                <div key={q.id} className="hm-card flex items-start gap-2 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/qbank/question/${q.id}`} className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-brand-blue">
                        {q.subject_name}
                        {q.chapter_name ? ` · ${q.chapter_name}` : ""}
                      </span>
                      {q.topic_name && (
                        <span className="inline-block rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                          {q.topic_name}
                        </span>
                      )}
                      {mastery && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${mastery.className}`}>
                          {mastery.label}
                        </span>
                      )}
                    </div>
                    <div className="line-clamp-2 text-sm text-[var(--color-text)]">
                      <RichContent html={q.text} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                      {q.incorrect_count != null && (
                        <span className={isRepeated ? "font-bold text-brand-red" : ""}>
                          {isRepeated && <span aria-hidden="true">🔁 </span>}
                          {q.incorrect_count === 1 ? "Wrong once" : `Wrong ${q.incorrect_count} times`}
                        </span>
                      )}
                      {lastAttempted && <span>Last attempted: {lastAttempted}</span>}
                      {isConfidenceTrap && (
                        <span className="font-bold text-amber-700">
                          <span aria-hidden="true">⚠️</span> Confidence Trap
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(q)}
                    disabled={bookmarking === q.id}
                    aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
                    aria-pressed={bookmarked}
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg transition hover:bg-[var(--color-surface-muted)] disabled:opacity-40 ${
                      bookmarked ? "text-brand-blue" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    <BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })}
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
