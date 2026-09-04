"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { BookmarkIcon, CheckCircleIcon, LockIcon, VideosIcon } from "@/components/icons";
import RequireAuth from "@/components/RequireAuth";
import { videoEmbedUrl } from "@/components/RichContent";
import { api } from "@/lib/api";
import { formatDuration } from "@/components/videos/videoCardShared";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function PlayerContent() {
  const { id } = useParams();
  const router = useRouter();
  const videoRef = useRef(null);
  const seekedRef = useRef(false);

  const [video, setVideo] = useState(null);
  const [error, setError] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [autoNext, setAutoNext] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [rate, setRate] = useState(1);

  // Deliberately does not reset video/error to null/false before the
  // fetch — only inside the resolved .then()/.catch() below. A leading
  // synchronous reset would trip react-hooks/set-state-in-effect the
  // same way bookmarks/mistakes/history's `load()` pattern already does
  // elsewhere, and unlike those pages this one has no real need for it:
  // the previous video's content staying on screen for the brief moment
  // before the new one resolves matches this page's existing (unchanged)
  // behavior on an id change, and Retry re-uses this exact function.
  function load() {
    api
      .get(`/videos/${id}/`)
      .then((v) => {
        setVideo(v);
        setError(false);
        setBookmarked(!!v.progress?.is_bookmarked);
        if (v.chapter) api.get(`/videos/?chapter=${v.chapter}`).then(setSiblings).catch(() => {});
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    seekedRef.current = false; // otherwise a video reached via "More from this chapter"/auto-next
    // inherits the previous video's already-seeked flag and never restores its own resume position
    load();
    api.get(`/video-notes/?video=${id}`).then(setNotes).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!video?.has_access || video.source_type !== "upload") return;
    const el = videoRef.current;
    if (!el) return;

    function onLoadedMetadata() {
      if (!seekedRef.current && video.progress?.last_position_seconds) {
        el.currentTime = video.progress.last_position_seconds;
        seekedRef.current = true;
      }
    }
    function pingProgress(markComplete) {
      api
        .post(`/videos/${id}/progress/`, { position_seconds: Math.floor(el.currentTime), mark_complete: markComplete })
        .catch(() => {});
    }
    function onEnded() {
      pingProgress(true);
      if (autoNext) {
        const idx = siblings.findIndex((s) => s.id === video.id);
        const next = idx >= 0 ? siblings[idx + 1] : null;
        if (next) router.push(`/videos/${next.id}`);
      }
    }

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("ended", onEnded);
    const interval = setInterval(() => {
      if (!el.paused) pingProgress(false);
    }, 10000);

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("ended", onEnded);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, siblings, autoNext, id]);

  async function toggleBookmark() {
    const data = await api.post(`/videos/${id}/bookmark/`);
    setBookmarked(data.is_bookmarked);
  }

  async function markComplete() {
    await api.post(`/videos/${id}/progress/`, { position_seconds: video.duration_seconds, mark_complete: true });
    setVideo((v) => ({ ...v, progress: { ...v.progress, is_completed: true } }));
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const timestamp = video.source_type === "upload" && videoRef.current ? Math.floor(videoRef.current.currentTime) : null;
    const created = await api.post("/video-notes/", { video: Number(id), text: noteText.trim(), timestamp_seconds: timestamp });
    setNotes((n) => [...n, created]);
    setNoteText("");
  }

  if (error) {
    return (
      <AppShell>
        <Header title="Video" showBack />
        <div className="hm-page-narrow">
          <div className="hm-card p-4">
            <p className="text-sm text-brand-red">Unable to load this video.</p>
            <button type="button" onClick={load} className="mt-2 text-xs font-bold text-brand-blue">
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }
  if (!video) {
    return (
      <AppShell>
        <Header title="Video" showBack />
        <div className="hm-page-narrow flex flex-col gap-4">
          <div className="aspect-video w-full animate-pulse rounded-xl bg-[var(--color-surface-muted)]" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-surface-muted)]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!video.has_access) {
    return (
      <AppShell>
        <Header title={video.title} showBack />
        <div className="hm-page-narrow flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
            <LockIcon className="h-7 w-7" />
          </span>
          <p className="text-lg font-bold text-[var(--color-text)]">This video needs an upgrade</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Subscribe or enroll to unlock &quot;{video.title}&quot; and the rest of this course&apos;s video lectures.
          </p>
          <Link href="/plans" className="hm-btn-primary mt-2">
            View Plans
          </Link>
        </div>
      </AppShell>
    );
  }

  const embedUrl = video.source_type !== "upload" ? videoEmbedUrl(video.play_url) : null;
  const chapterSiblings = siblings.filter((s) => s.id !== video.id);

  return (
    <AppShell>
      <Header title={video.title} showBack />

      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {video.source_type === "upload" ? (
            <video ref={videoRef} src={video.play_url} controls className="h-full w-full" />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a
              href={video.play_url}
              target="_blank"
              rel="noreferrer"
              className="flex h-full w-full items-center justify-center text-sm font-semibold text-white"
            >
              Watch on external site ↗
            </a>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {video.source_type === "upload" && (
              <select
                value={rate}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setRate(r);
                  if (videoRef.current) videoRef.current.playbackRate = r;
                }}
                className="hm-input w-24 text-xs"
                aria-label="Playback speed"
              >
                {PLAYBACK_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
              Auto next
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              aria-pressed={bookmarked}
              className={`hm-btn-outline flex items-center gap-1.5 text-xs ${bookmarked ? "text-brand-blue" : ""}`}
            >
              <BookmarkIcon fill={bookmarked ? "currentColor" : "none"} /> {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            {video.source_type !== "upload" && !video.progress?.is_completed && (
              <button type="button" onClick={markComplete} className="hm-btn-outline text-xs">
                Mark as Completed
              </button>
            )}
            {video.progress?.is_completed && (
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-green">
                <CheckCircleIcon className="h-4 w-4" /> Completed
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">{video.title}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {video.instructor_display} · {video.subject_name}
            {video.chapter_name ? ` · ${video.chapter_name}` : ""} · {formatDuration(video.duration_seconds)}
          </p>
          {video.description && <p className="mt-2 text-sm text-[var(--color-text)]">{video.description}</p>}
        </div>

        {video.linked_tests_detail?.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Linked Quizzes</p>
            <div className="flex flex-col gap-2">
              {video.linked_tests_detail.map((t) => (
                <Link key={t.id} href={`/tests/${t.id}`} className="hm-card flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="min-w-0 truncate font-semibold text-[var(--color-text)]">{t.title}</span>
                  <span className="flex-none text-xs font-bold text-brand-blue">Open →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {video.resources?.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Resources</p>
            <div className="flex flex-col gap-2">
              {video.resources.map((r) => {
                const downloadAllowed =
                  (r.resource_type !== "notes" || video.allow_notes_download) &&
                  (r.resource_type !== "slides" || video.allow_slides_download);
                const link = r.file || r.external_url;
                return (
                  <div key={r.id} className="hm-card flex items-center justify-between gap-3 p-3 text-sm">
                    <span className="min-w-0 truncate text-[var(--color-text)]">{r.title}</span>
                    {downloadAllowed && link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="flex-none text-xs font-bold text-brand-blue">
                        Download →
                      </a>
                    ) : (
                      <span className="flex-none text-xs text-[var(--color-text-muted)]">Not downloadable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {chapterSiblings.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              More from {video.chapter_name || "this chapter"}
            </p>
            <div className="flex flex-col gap-2">
              {chapterSiblings.map((s) => (
                <Link key={s.id} href={`/videos/${s.id}`} className="hm-card relative flex items-center gap-3 p-2.5">
                  <span
                    className={`flex h-10 w-14 flex-none items-center justify-center rounded-lg bg-[var(--color-surface-muted)] ${
                      s.progress?.is_completed ? "text-brand-green" : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {s.progress?.is_completed ? <CheckCircleIcon className="h-4 w-4" /> : <VideosIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{s.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatDuration(s.duration_seconds)}</p>
                  </div>
                  {!s.has_access && <LockIcon className="h-3.5 w-3.5 flex-none text-amber-700" />}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">My Notes</p>
          <div className="flex flex-col gap-2">
            {notes.map((n) => (
              <div key={n.id} className="hm-card p-3 text-sm">
                {n.timestamp_seconds != null && (
                  <span className="mr-2 font-mono text-xs text-brand-blue">{formatDuration(n.timestamp_seconds)}</span>
                )}
                {n.text}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              className="hm-input flex-1"
              aria-label="Add a note"
            />
            <button type="button" onClick={addNote} className="hm-btn-primary text-xs">
              Add
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function VideoPlayerPage() {
  return (
    <RequireAuth>
      <PlayerContent />
    </RequireAuth>
  );
}
