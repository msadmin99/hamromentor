"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { CheckCircleIcon, VideosIcon } from "@/components/icons";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import {
  AccessBadge, ErrorCard, formatDuration, SkeletonListRow, VideoBreadcrumb,
} from "@/components/videos/videoCardShared";

function ChapterVideosContent() {
  const { slug, chapterId } = useParams();
  const [subjectName, setSubjectName] = useState(null); // fetched only for the breadcrumb label
  const [chapter, setChapter] = useState(null);
  const [videos, setVideos] = useState(null); // null = loading
  const [error, setError] = useState(false);

  // Previously had no .catch() at all on the chapter fetch — a failed
  // request left `chapter` at null forever with no error shown, and the
  // videos list (still `[]`) rendered the ordinary "no videos" empty copy,
  // indistinguishable from a chapter that genuinely has none. No
  // synchronous reset before the fetch (see videos/[id]/page.js's load()
  // for why) — state only changes inside .then()/.catch(), so this stays
  // reusable by both the mount effect and the Retry button without
  // tripping react-hooks/set-state-in-effect.
  function load() {
    Promise.all([api.get(`/chapters/${chapterId}/`), api.get(`/videos/?chapter=${chapterId}`)])
      .then(([c, v]) => {
        setChapter(c);
        setVideos(v);
        setError(false);
      })
      .catch(() => setError(true));
    api.get(`/subjects/${slug}/`).then((s) => setSubjectName(s.name)).catch(() => {});
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, slug]);

  return (
    <AppShell>
      <Header title={chapter?.name || "Unit"} showBack />

      <div className="hm-page flex flex-col gap-3">
        <VideoBreadcrumb
          items={[
            { label: "Videos", href: "/videos" },
            { label: subjectName || "Subject", href: `/videos/subject/${slug}` },
            { label: chapter?.name || "Unit" },
          ]}
        />

        {error && <ErrorCard onRetry={load} />}

        {!error && videos === null && (
          <div className="flex flex-col gap-2.5">
            <SkeletonListRow />
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        )}

        {!error && videos !== null && videos.map((v) => (
          <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative flex items-center gap-3 p-3">
            <AccessBadge hasAccess={v.has_access} />
            <span
              className={`flex h-12 w-16 flex-none items-center justify-center rounded-lg bg-[var(--color-surface-muted)] ${
                v.progress?.is_completed ? "text-brand-green" : "text-[var(--color-text-muted)]"
              }`}
            >
              {v.progress?.is_completed ? <CheckCircleIcon /> : <VideosIcon />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {v.instructor_display} · {formatDuration(v.duration_seconds)}
              </p>
            </div>
          </Link>
        ))}

        {!error && videos !== null && videos.length === 0 && (
          <div className="hm-card p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <VideosIcon />
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No videos available yet.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Video lessons for this unit will appear here when available.
            </p>
            <Link
              href={`/videos/subject/${slug}`}
              className="mt-4 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white"
            >
              Browse Other Units →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ChapterVideosPage() {
  return (
    <RequireAuth>
      <ChapterVideosContent />
    </RequireAuth>
  );
}
