"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function formatDuration(seconds) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.floor((seconds || 0) % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ChapterVideosContent() {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/chapters/${chapterId}/`).then(setChapter);
    api
      .get(`/videos/?chapter=${chapterId}`)
      .then(setVideos)
      .finally(() => setLoading(false));
  }, [chapterId]);

  return (
    <AppShell>
      <Header title={chapter?.name || "Unit"} showBack />

      <div className="hm-page flex flex-col gap-2.5">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
        {videos.map((v) => (
          <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative flex items-center gap-3 p-3">
            {!v.has_access && (
              <span className="absolute right-2 top-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                🔒 PRO
              </span>
            )}
            <span className="flex h-12 w-16 flex-none items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-xl">
              {v.progress?.is_completed ? "✅" : "🎬"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {v.instructor_display} · {formatDuration(v.duration_seconds)}
              </p>
            </div>
          </Link>
        ))}
        {!loading && videos.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No videos in this unit yet.</p>}
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
