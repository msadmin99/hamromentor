"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { BookmarkIcon, SearchIcon, VideosIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";
import { AccessBadge, ErrorCard, formatDuration, WatchProgress } from "@/components/videos/videoCardShared";

// Phase D, Area 3: same endpoints as before (/videos/continue_watching/,
// /videos/recommended/, /subjects/, /videos/?search=&access=&sort=&
// bookmarked=). No pagination is exposed to the frontend for /videos/ —
// the backend's GlobalSafeListPagination caps it at 500 and returns a
// bare array (see Backend/hamromentor/pagination.py) rather than a
// {results, next} envelope, so there's nothing for the frontend to page
// through; loading the full filtered set on each search is the existing,
// correct behavior, not something this pass changes.
const FILTERS = [
  { key: "", label: "All" },
  { key: "free", label: "Free" },
  { key: "premium", label: "Premium" },
];
const SORTS = [
  { key: "", label: "Default" },
  { key: "recent", label: "Recently Added" },
  { key: "popular", label: "Most Viewed" },
];

function ContinueLearningRow({ items }) {
  if (!items.length) return null;
  return (
    <section>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Continue Learning</p>
      <div className="hm-scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link key={item.video.id} href={`/videos/${item.video.id}`} className="hm-card w-64 flex-none p-3">
            <div className="flex h-28 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
              {item.video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.video.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <VideosIcon />
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">{item.video.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{item.video.subject_name}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {formatDuration(item.last_position_seconds)} / {formatDuration(item.duration_seconds)}
              </span>
              <span className="rounded-md bg-brand-blue px-2 py-1 text-[10px] font-bold text-white">Resume</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
              <div
                className="h-full bg-brand-blue"
                style={{ width: `${item.duration_seconds ? Math.min((item.last_position_seconds / item.duration_seconds) * 100, 100) : 0}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function VideoRow({ title, videos, seeAllHref }) {
  if (!videos.length) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-xs font-bold text-brand-blue">
            See all →
          </Link>
        )}
      </div>
      <div className="hm-scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {videos.map((v) => (
          <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative w-56 flex-none p-3">
            <AccessBadge hasAccess={v.has_access} />
            <div className="flex h-24 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <VideosIcon />
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {v.subject_name} · {formatDuration(v.duration_seconds)}
            </p>
            <WatchProgress progress={v.progress} durationSeconds={v.duration_seconds} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function VideosContent() {
  const { activeCourse } = useCourse();
  const [continueWatching, setContinueWatching] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [subjects, setSubjects] = useState(null); // null = loading
  const [subjectsError, setSubjectsError] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  useEffect(() => {
    // Read outside next/navigation's useSearchParams so this page can stay statically
    // prerendered (see the register page for the same fix).
    if (new URLSearchParams(window.location.search).get("bookmarked") === "true") {
      setBookmarkedOnly(true);
    }
  }, []);

  useEffect(() => {
    // Secondary, supplementary rows — a failure here just means the row
    // doesn't render (matching their own `if (!items.length) return null`
    // behavior), not a page-level error state.
    api.get("/videos/continue_watching/").then(setContinueWatching).catch(() => {});
    api.get("/videos/recommended/").then(setRecommended).catch(() => {});
  }, []);

  function loadSubjects() {
    setSubjects(null);
    setSubjectsError(false);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/subjects/?${params.toString()}`)
      .then(setSubjects)
      .catch(() => {
        setSubjects([]);
        setSubjectsError(true);
      });
  }
  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourse?.id]);

  function runSearch() {
    setSearchError(false);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter) params.set("access", filter);
    if (sort) params.set("sort", sort);
    if (bookmarkedOnly) params.set("bookmarked", "true");
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api.get(`/videos/?${params.toString()}`).then(setSearchResults).catch(() => setSearchError(true));
  }
  useEffect(() => {
    if (!search && !filter && !sort && !bookmarkedOnly) {
      setSearchResults(null);
      setSearchError(false);
      return;
    }
    const handle = setTimeout(runSearch, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, sort, bookmarkedOnly, activeCourse?.id]);

  const browsing = searchResults === null && !searchError;

  return (
    <AppShell>
      <Header title="Video Lectures" right={<SearchIcon />} courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, chapter, topic, instructor…"
            className="hm-input"
            aria-label="Search videos"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  filter === f.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {f.label}
              </button>
            ))}
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  sort === s.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBookmarkedOnly((v) => !v)}
              aria-pressed={bookmarkedOnly}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                bookmarkedOnly ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              <BookmarkIcon fill={bookmarkedOnly ? "currentColor" : "none"} /> My Bookmarks
            </button>
          </div>
        </div>

        {searchError && <ErrorCard onRetry={runSearch} />}

        {!searchError && !browsing && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((v) => (
                <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative flex items-center gap-3 p-3">
                  <AccessBadge hasAccess={v.has_access} />
                  <span className="flex h-12 w-16 flex-none items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                    <VideosIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {v.subject_name} · {formatDuration(v.duration_seconds)}
                    </p>
                    <WatchProgress progress={v.progress} durationSeconds={v.duration_seconds} />
                  </div>
                </Link>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="hm-card p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                  <SearchIcon />
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No videos match</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Try a different search term or filter.</p>
              </div>
            )}
          </section>
        )}

        {browsing && (
          <>
            <ContinueLearningRow items={continueWatching} />
            <VideoRow title="Recommended for you" videos={recommended} />

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Browse by subject</p>

              {subjects === null && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="hm-card flex animate-pulse items-start gap-2.5 p-3">
                      <div className="h-6 w-6 flex-none rounded bg-[var(--color-surface-muted)]" />
                      <div className="min-w-0 flex-1">
                        <div className="h-3.5 w-3/4 rounded bg-[var(--color-surface-muted)]" />
                        <div className="mt-1.5 h-3 w-1/2 rounded bg-[var(--color-surface-muted)]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {subjectsError && <ErrorCard onRetry={loadSubjects} />}

              {subjects !== null && !subjectsError && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {subjects.map((s) => (
                    <Link key={s.id} href={`/videos/subject/${s.slug}`} className="hm-card flex items-start gap-2.5 p-3">
                      <span className="text-xl">{s.icon}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{s.name}</p>
                        <p className="text-xs text-brand-blue">{s.video_count} videos</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {subjects !== null && !subjectsError && subjects.length === 0 && (
                <div className="hm-card p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                    <VideosIcon />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">No videos available yet.</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Video lessons for your subjects will appear here when available.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function VideosPage() {
  return (
    <RequireAuth>
      <VideosContent />
    </RequireAuth>
  );
}
