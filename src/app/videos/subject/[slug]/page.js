"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { VideosIcon } from "@/components/icons";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { ErrorCard, VideoBreadcrumb } from "@/components/videos/videoCardShared";

function SubjectVideosContent() {
  const { slug } = useParams();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState(false);

  // No synchronous reset before the fetch (see videos/[id]/page.js's load()
  // for why) — state only changes inside .then()/.catch(), which keeps this
  // reusable by both the mount effect and the Retry button without tripping
  // react-hooks/set-state-in-effect.
  function load() {
    api
      .get(`/subjects/${slug}/`)
      .then((s) => {
        setSubject(s);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const chapters = subject?.chapters?.filter((c) => c.video_count > 0) || [];

  return (
    <AppShell>
      <Header title={subject?.name || "Subject"} showBack />

      <div className="hm-page flex flex-col gap-3">
        <VideoBreadcrumb items={[{ label: "Videos", href: "/videos" }, { label: subject?.name || "Subject" }]} />

        {error && <ErrorCard onRetry={load} />}

        {!error && subject === null && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="hm-card flex animate-pulse items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-muted)]" />
                  <div className="mt-1.5 h-3 w-1/3 rounded bg-[var(--color-surface-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!error && subject !== null && chapters.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {chapters.map((chapter) => (
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
          </div>
        )}

        {!error && subject !== null && chapters.length === 0 && (
          <div className="hm-card p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <VideosIcon />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No videos available yet.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Video lessons for this subject will appear here when available.
            </p>
            <Link href="/videos" className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Browse Subjects →
            </Link>
          </div>
        )}
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
