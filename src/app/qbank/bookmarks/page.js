"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

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

  return (
    <AppShell>
      <Header title="Bookmarks" subtitle="Questions you saved for later" showBack />

      <div className="hm-page-narrow flex flex-col gap-3">
        {questions === null && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        {questions?.map((q) => (
          <Link key={q.id} href={`/qbank/question/${q.id}`} className="hm-card flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{q.subject_name}</p>
              <div className="mt-1 line-clamp-3 overflow-hidden text-sm text-[var(--color-text)]">
                <RichContent html={q.text} />
              </div>
            </div>
            <span className="flex-none pt-1 text-[var(--color-text-muted)]" aria-hidden="true">
              ›
            </span>
          </Link>
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
