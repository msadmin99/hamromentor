"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import ChapterDrilldown from "@/components/performance/ChapterDrilldown";
import ComparativeCard from "@/components/performance/ComparativeCard";
import KpiCards from "@/components/performance/KpiCards";
import QuestionAnalytics from "@/components/performance/QuestionAnalytics";
import Recommendations from "@/components/performance/Recommendations";
import StrengthsWeaknesses from "@/components/performance/StrengthsWeaknesses";
import SubjectTable from "@/components/performance/SubjectTable";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

const TrendCharts = dynamic(() => import("@/components/performance/TrendCharts"), { ssr: false });
const MockTestAnalytics = dynamic(() => import("@/components/performance/MockTestAnalytics"), { ssr: false });
const ActivityCalendar = dynamic(() => import("@/components/performance/ActivityCalendar"), { ssr: false });

const PERIODS = [
  { key: "1", label: "Today" },
  { key: "7", label: "7 Days" },
  { key: "30", label: "30 Days" },
  { key: "90", label: "90 Days" },
  { key: "all", label: "All Time" },
];

function formatWatchTime(seconds) {
  const hours = Math.floor((seconds || 0) / 3600);
  const minutes = Math.round(((seconds || 0) % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function pad(n) {
  return String(n).length < 2 ? `0${n}` : String(n);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function PerformanceContent() {
  const { user } = useAuth();
  const { activeCourse } = useCourse();
  const courseId = activeCourse?.id;

  const [period, setPeriod] = useState("30");
  const [overview, setOverview] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);

  const [month, setMonth] = useState(currentMonthKey());
  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  const [comparative, setComparative] = useState(null);
  const [recentAttempt, setRecentAttempt] = useState(null);

  const loadOverview = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: period });
    if (courseId) params.set("course", courseId);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then(setOverview)
      .finally(() => setLoading(false));
  }, [period, courseId]);

  useEffect(loadOverview, [loadOverview]);

  useEffect(() => {
    api.get("/videos/student_summary/").then(setVideoStats).catch(() => {});
    api.get("/my-subscriptions/").then(setSubscriptions).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/attempts/mine/").then((attempts) => {
      const latest = (attempts || []).find((a) => a.status === "submitted");
      setRecentAttempt(latest || null);
    });
  }, []);

  useEffect(() => {
    if (!recentAttempt) return;
    api.get(`/attempts/${recentAttempt.id}/comparative/`).then(setComparative).catch(() => {});
  }, [recentAttempt]);

  useEffect(() => {
    setCalendarLoading(true);
    const params = new URLSearchParams({ month });
    if (courseId) params.set("course", courseId);
    api
      .get(`/performance/calendar/?${params.toString()}`)
      .then(setCalendar)
      .finally(() => setCalendarLoading(false));
  }, [month, courseId]);

  function selectSubject(id, name) {
    setSelectedSubject({ id, name });
    setChapterLoading(true);
    api
      .get(`/performance/subjects/${id}/`)
      .then(setChapterData)
      .finally(() => setChapterLoading(false));
  }

  const activeSubscription = useMemo(
    () => (subscriptions?.subscriptions || []).find((s) => s.is_current),
    [subscriptions]
  );

  const courseCompletion = useMemo(() => {
    const subjects = overview?.subjects || [];
    const withQuestions = subjects.filter((s) => s.total_questions > 0);
    if (withQuestions.length === 0) return 0;
    const avg = withQuestions.reduce((sum, s) => sum + s.completion_percent, 0) / withQuestions.length;
    return Math.round(avg * 10) / 10;
  }, [overview]);

  return (
    <AppShell>
      <Header title="My Performance" subtitle="Your personal analytics center" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <section className="hm-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{activeCourse?.name || "No course selected"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">Subscription</p>
            <p className="text-sm font-bold text-[var(--color-text)]">
              {activeSubscription ? "Active" : "No active subscription"}
            </p>
          </div>
          <Link href="/subscriptions" className="text-xs font-bold text-brand-blue">
            Manage →
          </Link>
        </section>

        <div className="flex flex-wrap rounded-lg border border-[var(--color-border)] p-0.5 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                period === p.key ? "bg-brand-blue text-white" : "text-[var(--color-text-muted)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading your performance data…</p>}

        {!loading && overview && (
          <>
            <KpiCards kpis={overview.kpis} />

            <section className="hm-card p-4">
              <p className="text-sm font-bold text-[var(--color-text)]">Performance Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Course Completion</p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">{courseCompletion}%</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Subjects Touched</p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">
                    {(overview.subjects || []).filter((s) => s.attempted > 0).length} / {(overview.subjects || []).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Videos Completed</p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">{videoStats?.videos_completed ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Video Watch Time</p>
                  <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">
                    {videoStats ? formatWatchTime(videoStats.total_watch_seconds) : "—"}
                  </p>
                </div>
              </div>
            </section>

            <TrendCharts trend={overview.trend} />

            <SubjectTable subjects={overview.subjects} onSelectSubject={selectSubject} />

            {selectedSubject && (
              <ChapterDrilldown
                subjectName={selectedSubject.name}
                data={chapterData}
                loading={chapterLoading}
                onClose={() => {
                  setSelectedSubject(null);
                  setChapterData(null);
                }}
              />
            )}

            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Quiz & Exam History</p>
                <Link href="/tests/history" className="text-xs font-bold text-brand-blue">
                  View all attempts →
                </Link>
              </div>
              {recentAttempt && (
                <Link href={`/tests/result/${recentAttempt.id}`} className="hm-card flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{recentAttempt.test_title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Score {recentAttempt.score}/{recentAttempt.total_marks}
                      {recentAttempt.accuracy != null && ` · ${recentAttempt.accuracy}% accuracy`}
                      {recentAttempt.rank && ` · Rank ${recentAttempt.rank}`}
                    </p>
                  </div>
                  <span className="flex-none text-[var(--color-text-muted)]">›</span>
                </Link>
              )}
            </section>

            {comparative && recentAttempt && <ComparativeCard comparative={comparative} testTitle={recentAttempt.test_title} />}

            <MockTestAnalytics mockTests={overview.mock_tests} />

            <QuestionAnalytics questions={overview.questions} />

            <StrengthsWeaknesses data={overview.strengths_weaknesses} />

            <Recommendations recommendations={overview.recommendations} />

            <ActivityCalendar month={month} onMonthChange={setMonth} calendar={calendar} loading={calendarLoading} />
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function PerformancePage() {
  return (
    <RequireAuth>
      <PerformanceContent />
    </RequireAuth>
  );
}
