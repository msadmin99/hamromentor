"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// Subject -> Chapter groups (topic shown as a per-question badge rather than
// a third accordion level — most chapters here only carry 1-2 topics, so a
// full drill-down adds a tap without adding real navigation value).
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
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ bookmarked: "true" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/?${params.toString()}`)
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, [activeCourse?.id]);

  const groups = useMemo(() => groupBySubjectAndChapter(questions || []), [questions]);

  return (
    <AppShell>
      <Header title="Bookmarks" subtitle="Questions you saved for later" showBack />

      <div className="hm-page-narrow flex flex-col gap-5">
        {questions === null && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        {groups.map(({ subject, chapters }) => (
          <div key={subject} className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">{subject}</p>
            {chapters.map(({ chapter, items }) => (
              <div key={chapter} className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">{chapter}</p>
                {items.map((q) => (
                  <Link key={q.id} href={`/qbank/question/${q.id}`} className="hm-card flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      {q.topic_name && (
                        <p className="mb-1 inline-block rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                          {q.topic_name}
                        </p>
                      )}
                      <div className="line-clamp-3 overflow-hidden text-sm text-[var(--color-text)]">
                        <RichContent html={q.text} />
                      </div>
                    </div>
                    <span className="flex-none pt-1 text-[var(--color-text-muted)]" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}

        {questions?.length === 0 && (
          <div className="hm-card p-8 text-center">
            <p className="text-3xl">🔖</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">No bookmarks yet</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              While solving questions in the Question Bank, tap the bookmark icon to save one for later revision.
            </p>
            <Link href="/qbank" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Go to Question Bank
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
