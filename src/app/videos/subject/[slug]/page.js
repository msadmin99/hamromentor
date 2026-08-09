"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function SubjectVideosContent() {
  const { slug } = useParams();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/subjects/${slug}/`)
      .then(setSubject)
      .catch((e) => setError(e.message));
  }, [slug]);

  return (
    <AppShell>
      <Header title={subject?.name || "Subject"} showBack />

      <div className="hm-page flex flex-col gap-2.5">
        {error && <p className="text-sm text-brand-red">{error}</p>}
        {!subject && !error && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subject?.chapters
            ?.filter((chapter) => chapter.video_count > 0)
            .map((chapter) => (
              <Link
                key={chapter.id}
                href={`/videos/subject/${slug}/${chapter.id}`}
                className="hm-card flex items-center justify-between p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{chapter.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{chapter.video_count} videos</p>
                </div>
              </Link>
            ))}
          {subject && subject.chapters?.filter((c) => c.video_count > 0).length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No videos in this subject yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function SubjectVideosPage() {
  return (
    <RequireAuth>
      <SubjectVideosContent />
    </RequireAuth>
  );
}
