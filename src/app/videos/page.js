"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { SearchIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

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

function formatDuration(seconds) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.floor((seconds || 0) % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ContinueLearningRow({ items }) {
  if (!items.length) return null;
  return (
    <section>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Continue Learning</p>
      <div className="hm-scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link key={item.video.id} href={`/videos/${item.video.id}`} className="hm-card w-64 flex-none p-3">
            <div className="flex h-28 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-2xl">
              {item.video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.video.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                "🎬"
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
            {!v.has_access && (
              <span className="absolute right-2 top-2 z-10 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                🔒 PRO
              </span>
            )}
            <div className="flex h-24 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-2xl">
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                "🎬"
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {v.subject_name} · {formatDuration(v.duration_seconds)}
            </p>
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
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read outside next/navigation's useSearchParams so this page can stay statically
    // prerendered (see the register page for the same fix).
    if (new URLSearchParams(window.location.search).get("bookmarked") === "true") {
      setBookmarkedOnly(true);
    }
  }, []);

  useEffect(() => {
    api.get("/videos/continue_watching/").then(setContinueWatching).catch(() => {});
    api.get("/videos/recommended/").then(setRecommended).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/subjects/?${params.toString()}`)
      .then(setSubjects)
      .finally(() => setLoading(false));
  }, [activeCourse?.id]);

  useEffect(() => {
    if (!search && !filter && !sort && !bookmarkedOnly) {
      setSearchResults(null);
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter) params.set("access", filter);
    if (sort) params.set("sort", sort);
    if (bookmarkedOnly) params.set("bookmarked", "true");
    if (activeCourse?.id) params.set("course", activeCourse.id);
    const handle = setTimeout(() => {
      api.get(`/videos/?${params.toString()}`).then(setSearchResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, filter, sort, bookmarkedOnly, activeCourse?.id]);

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
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
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
                onClick={() => setSort(s.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  sort === s.key ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => setBookmarkedOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                bookmarkedOnly ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              🔖 My Bookmarks
            </button>
          </div>
        </div>

        {searchResults ? (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((v) => (
                <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative flex items-center gap-3 p-3">
                  {!v.has_access && (
                    <span className="absolute right-2 top-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                      🔒 PRO
                    </span>
                  )}
                  <span className="flex h-12 w-16 flex-none items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-xl">
                    🎬
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{v.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {v.subject_name} · {formatDuration(v.duration_seconds)}
                    </p>
                  </div>
                </Link>
              ))}
              {searchResults.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No videos match.</p>}
            </div>
          </section>
        ) : (
          <>
            <ContinueLearningRow items={continueWatching} />
            <VideoRow title="Recommended for you" videos={recommended} />

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Browse by subject</p>
              {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading subjects…</p>}
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
