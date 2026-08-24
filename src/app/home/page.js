"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { SearchIcon, BookmarkIcon, UserIcon } from "@/components/icons";
import DailyGoalCard from "@/components/home/DailyGoalCard";
import ExploreTestTypes from "@/components/home/ExploreTestTypes";
import HomeHero from "@/components/home/HomeHero";
import PerformanceSnapshot from "@/components/home/PerformanceSnapshot";
import RecentPerformanceList from "@/components/home/RecentPerformanceList";
import StreakCard from "@/components/home/StreakCard";
import SuggestedTestsRow from "@/components/home/SuggestedTestsRow";
import UpcomingSessionsWidget from "@/components/UpcomingSessionsWidget";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

const QUOTES = [
  "Small daily improvements lead to stunning results.",
  "Discipline today. Success tomorrow.",
  "Every question you solve is a step closer to your goal.",
];

function formatDuration(seconds) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.floor((seconds || 0) % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function HomeContent() {
  const { user } = useAuth();
  const { activeCourse } = useCourse();
  const [dashboard, setDashboard] = useState(null);
  const [tests, setTests] = useState([]);
  const [error, setError] = useState("");
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api
      .get("/home/")
      .then(setDashboard)
      .catch((e) => setError(e.message));
    // "Suggested tests of the day" spans every test type (not just Mock),
    // with free tests surfaced first — a signed-in student with no active
    // subscription should still see something they can actually start.
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then((data) => {
        const sorted = [...data].sort((a, b) => Number(a.is_pro) - Number(b.is_pro));
        setTests(sorted.slice(0, 4));
      })
      .catch(() => {});
  }, [activeCourse?.id]);

  useEffect(() => {
    api
      .get("/videos/continue_watching/")
      .then(setContinueWatching)
      .catch(() => {});
    const params = new URLSearchParams({ sort: "recent" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/videos/?${params.toString()}`)
      .then((data) => setRecentVideos(data.slice(0, 6)))
      .catch(() => {});
  }, [activeCourse?.id]);

  useEffect(() => {
    const params = new URLSearchParams({ days: "30", granularity: "day" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then(setPerformance)
      .catch(() => setPerformance(null));
    api
      .get("/attempts/mine/")
      .then(setAttempts)
      .catch(() => {});
  }, [activeCourse?.id]);

  const banner = dashboard?.banners?.[0];
  const mcq = dashboard?.mcq_of_the_day;
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  function scrollToTestTypes() {
    document.getElementById("test-types")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell>
      <Header
        title="Dr. Gutka"
        right={
          <>
            <BookmarkIcon />
            <SearchIcon />
            <Link href="/profile" aria-label="Profile">
              <UserIcon />
            </Link>
          </>
        }
        courseSwitcher={<CourseSwitcher />}
      />
      <AnnouncementBar announcement={dashboard?.announcement} />

      <div className="hm-page flex flex-col gap-5">
        {error && <p className="text-xs text-brand-red">{error}</p>}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <HomeHero name={user?.first_name || "Student"} onStartTest={scrollToTestTypes} />

            {banner && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Featured
                </p>
                <div
                  className="relative overflow-hidden rounded-2xl px-5 py-6 text-white shadow-sm"
                  style={{ background: banner.background_color }}
                >
                  {banner.tag && (
                    <span className="absolute right-4 top-4 rounded-md bg-yellow-400 px-2 py-1 text-[10px] font-extrabold text-[#3a2c00]">
                      {banner.tag}
                    </span>
                  )}
                  <h2 className="max-w-[90%] text-2xl font-extrabold leading-tight sm:max-w-[75%]">{banner.title}</h2>
                  {banner.subtitle && <p className="mt-3 text-sm text-white/85">{banner.subtitle}</p>}
                </div>
              </section>
            )}

            {mcq?.question && (
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" /> {mcq.label} · {mcq.question.subject_name}
                </p>
                <Link href={`/qbank/question/${mcq.question.id}`} className="hm-card block p-4">
                  <p className="text-sm font-medium text-[var(--color-text)]">{mcq.question.text}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {mcq.question.options?.map((opt, i) => (
                      <li
                        key={opt.id}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]"
                      >
                        {String.fromCharCode(65 + i)}) {opt.text}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-3 inline-block text-xs font-bold text-brand-blue">Solve now →</span>
                </Link>
              </section>
            )}

            <UpcomingSessionsWidget />

            <SuggestedTestsRow tests={tests} />

            <div id="test-types">
              <ExploreTestTypes />
            </div>

            <PerformanceSnapshot kpis={performance?.kpis} trend={performance?.trend} />

            {(continueWatching.length > 0 || recentVideos.length > 0) && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">🎥 Video Lectures</p>
                  <Link href="/videos" className="text-xs font-bold text-brand-blue">
                    See all →
                  </Link>
                </div>
                <div className="hm-scrollbar-none flex gap-3 overflow-x-auto pb-1">
                  {(continueWatching.length > 0
                    ? continueWatching.map((item) => ({ ...item.video, _resume: item }))
                    : recentVideos
                  ).map((v) => (
                    <Link key={v.id} href={`/videos/${v.id}`} className="hm-card relative w-48 flex-none p-3">
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
                      {v._resume ? (
                        <>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {formatDuration(v._resume.last_position_seconds)} / {formatDuration(v._resume.duration_seconds)}
                          </p>
                          <span className="mt-1 inline-block rounded-md bg-brand-blue px-2 py-0.5 text-[10px] font-bold text-white">Resume</span>
                        </>
                      ) : (
                        <p className="text-[11px] text-[var(--color-text-muted)]">{v.subject_name}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <DailyGoalCard completed={performance?.kpis?.questions_today} goal={performance?.recommendations?.suggested_daily_question_goal} />

            <div className="hm-card p-4">
              <p className="text-sm italic leading-relaxed text-[var(--color-text)]">&ldquo;{quote}&rdquo;</p>
              <p className="mt-2 text-right text-xs font-semibold text-[var(--color-text-muted)]">— Dr. Gutka</p>
            </div>

            <StreakCard days={performance?.kpis?.current_streak_days} />

            <RecentPerformanceList attempts={attempts} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
