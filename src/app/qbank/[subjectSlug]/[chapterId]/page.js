"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function ChapterContent() {
  const { subjectSlug, chapterId } = useParams();
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    api.get(`/chapters/${chapterId}/`).then(setChapter);
  }, [chapterId]);

  return (
    <AppShell>
      <Header title={chapter?.name || "Chapter"} showBack />

      <div className="hm-page-narrow flex flex-col gap-4">
        {chapter && (
          <>
            <div className="hm-card flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-bold text-[var(--color-text)]">{chapter.mcq_count} MCQs</p>
                <p className="text-xs text-[var(--color-text-muted)]">Solve now</p>
              </div>
              <Link
                href={`/qbank/${subjectSlug}/${chapterId}/solve`}
                className="rounded-lg bg-brand-blue px-5 py-2 text-sm font-bold text-white"
              >
                SOLVE
              </Link>
            </div>

            {chapter.topics?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
                  Schema <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">New</span>
                </p>
                <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                  Collection of important and repeatedly asked topics from this module.
                </p>
                <div className="hm-card divide-y divide-[var(--color-border)]">
                  {chapter.topics.map((topic) => (
                    <div key={topic.id} className="px-4 py-3 text-sm text-[var(--color-text)]">
                      {topic.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
