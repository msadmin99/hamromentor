"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import ChapterHero from "@/components/qbank/ChapterHero";
import TopicSchemaList from "@/components/qbank/TopicSchemaList";
import PracticeCTA from "@/components/qbank/PracticeCTA";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";
import { themeForKey } from "@/lib/theme";

function ChapterContent() {
  const { subjectSlug, chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState(false);

  // Phase E QA: previously had no .catch() at all (the sibling subject
  // fetch two lines below already correctly had one) — a failed request
  // left the page on a bare "Loading…" forever.
  function loadChapter() {
    api
      .get(`/chapters/${chapterId}/`)
      .then((data) => {
        setChapter(data);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    loadChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  useEffect(() => {
    api.get(`/subjects/${subjectSlug}/`).then(setSubject).catch(() => setSubject(null));
  }, [subjectSlug]);

  const theme = themeForKey(subjectSlug);
  const solveHref = `/qbank/${subjectSlug}/${chapterId}/solve`;

  return (
    <AppShell>
      <Header title={chapter?.name || "Unit"} showBack />

      <div className="hm-page-narrow flex flex-col gap-4">
        {chapter && (
          <>
            <ChapterHero chapter={chapter} solveHref={solveHref} icon={subject?.icon || "📘"} theme={theme} />

            <TopicSchemaList
              topics={chapter.topics}
              theme={theme}
              solveHrefFor={(topic) => `${solveHref}?topic=${topic.id}`}
            />

            <PracticeCTA href={solveHref} />
          </>
        )}
        {error && <ErrorCard title="Unable to load this unit." onRetry={loadChapter} />}
        {!error && !chapter && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
      </div>
    </AppShell>
  );
}

export default function ChapterPage() {
  return (
    <RequireAuth>
      <ChapterContent />
    </RequireAuth>
  );
}
