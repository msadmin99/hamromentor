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

// Phase D, Area 1: same /questions/?bookmarked=true endpoint and grouping
// logic as before — the improvements below (count, error state, remove,
// status chip, search/subject filter, Practice CTA) all read fields
// already present on this response (is_bookmarked, mastery_status — see
// academics/serializers.py) or reuse already-existing routes/endpoints
// (POST /questions/{id}/bookmark/, /qbank/practice?status=bookmarked).
// Nothing new was added on the backend. MASTERY_META/stripHtml/SkeletonCard
// live in revisionListShared.js, shared with the Mistakes page (Area 1b)
// instead of being duplicated in both.

function groupBySubjectAndChapter(questions) {
  const bySubject = new Map();
  for (const q of questions) {
    const subjectKey = q.subject_name || "Other";
    if (!bySubject.has(subjectKey)) bySubject.set(subjectKey, new Map());
    const byChapter = bySubject.get(subjectKey);
    const chapterKey = q.chapter_name || "General";
    if (!byChapter.has(chapterKey)) byChapter.set(chapterKey, []);
    byChapter.get(chapterKey).push(q);
  }
  return Array.from(bySubject.entries()).map(([subject, byChapter]) => ({
    subject,
    chapters: Array.from(byChapter.entries()).map(([chapter, items]) => ({ chapter, items })),
  }));
}

function BookmarksContent() {
  const { activeCourse } = useCourse();
  const [questions, setQuestions] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [removingId, setRemovingId] = useState(null);

  function load() {
    setQuestions(null);
    setError(false);
    const params = new URLSearchParams({ bookmarked: "true" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/?${params.toString()}`)
      .then(setQuestions)
      .catch(() => {
        // Previously indistinguishable from "genuinely zero bookmarks" —
        // a failed request showed the same "No bookmarks yet" copy as a
        // real empty list. Now tracked separately so a fetch error says so.
        setQuestions([]);
        setError(true);
      });
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse?.id]);

  const subjects = useMemo(
    () => [...new Set((questions || []).map((q) => q.subject_name || "Other"))].sort(),
    [questions]
  );

  const filtered = useMemo(() => {
    const list = questions || [];
    const term = search.trim().toLowerCase();
    return list.filter((q) => {
      if (subjectFilter && (q.subject_name || "Other") !== subjectFilter) return false;
      if (term && !stripHtml(q.text).toLowerCase().includes(term)) return false;
      return true;
    });
  }, [questions, search, subjectFilter]);

  const groups = useMemo(() => groupBySubjectAndChapter(filtered), [filtered]);
  const totalCount = questions?.length ?? 0;

  async function removeBookmark(question) {
    setRemovingId(question.id);
    try {
      await api.post(`/questions/${question.id}/bookmark/`, { bookmark: false });
      setQuestions((prev) => (prev || []).filter((q) => q.id !== question.id));
    } catch {
      // leave it in place — nothing to undo, the toggle simply didn't take
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <AppShell>
      <Header
        title="Bookmarks"
        subtitle={totalCount > 0 ? `${totalCount} question${totalCount === 1 ? "" : "s"} saved for later` : "Questions you saved for later"}
        showBack
      />

      <div className="hm-page-narrow flex flex-col gap-4">
        {questions === null && (
          <div className="flex flex-col gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && questions !== null && (
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">Couldn&apos;t load your bookmarks right now.</p>
            <button type="button" onClick={load} className="mt-2 text-xs font-bold text-brand-blue">
              Retry
            </button>
          </div>
        )}

        {!error && questions !== null && totalCount > 0 && (
          <>
            <Link
              href="/qbank/practice?status=bookmarked&auto=1"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-center text-sm font-bold text-white transition hover:brightness-110"
            >
              Practice Bookmarked Questions ({totalCount})
            </Link>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookmarked questions…"
                className="hm-input pl-9"
                aria-label="Search bookmarked questions"
              />
            </div>

            {subjects.length > 1 && (
              <div className="hm-scrollbar-none flex gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSubjectFilter("")}
                  className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    subjectFilter === "" ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                  }`}
                >
                  All Subjects
                </button>
                {subjects.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubjectFilter(subjectFilter === s ? "" : s)}
                    aria-pressed={subjectFilter === s}
                    className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      subjectFilter === s ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {!error && groups.map(({ subject, chapters }) => (
          <div key={subject} className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">{subject}</p>
            {chapters.map(({ chapter, items }) => (
              <div key={chapter} className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">{chapter}</p>
                {items.map((q) => {
                  const mastery = MASTERY_META[q.mastery_status];
                  return (
                    <div key={q.id} className="hm-card flex items-start gap-2 p-4">
                      <Link href={`/qbank/question/${q.id}`} className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
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
                        <div className="line-clamp-3 overflow-hidden text-sm text-[var(--color-text)]">
                          <RichContent html={q.text} />
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeBookmark(q)}
                        disabled={removingId === q.id}
                        aria-label={`Remove bookmark: ${stripHtml(q.text).slice(0, 60)}`}
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-brand-blue transition hover:bg-[var(--color-surface-muted)] disabled:opacity-40"
                      >
                        <BookmarkIcon fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        {!error && questions !== null && totalCount > 0 && filtered.length === 0 && (
          <div className="hm-card p-6 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">No matches</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Try a different search term or subject.</p>
          </div>
        )}

        {!error && questions !== null && totalCount === 0 && (
          <div className="hm-card p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <BookmarkIcon />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No bookmarked questions yet</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Bookmark important questions while practicing and review them here.
            </p>
            <Link href="/qbank" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Start Practicing →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function BookmarksPage() {
  return (
    <RequireAuth>
      <BookmarksContent />
    </RequireAuth>
  );
}
