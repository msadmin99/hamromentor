"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import DailyRecommendedCard from "@/components/testpage/DailyRecommendedCard";
import PlatformStats from "@/components/testpage/PlatformStats";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHero from "@/components/testpage/TestPageHero";
import TestPageSidebar from "@/components/testpage/TestPageSidebar";
import TestSearchFilterBar from "@/components/testpage/TestSearchFilterBar";
import UpgradeBanner from "@/components/testpage/UpgradeBanner";
import { computePlatformStats } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function sortTests(tests, sort) {
  const copy = [...tests];
  if (sort === "newest") return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sort === "questions") return copy.sort((a, b) => (b.question_count ?? 0) - (a.question_count ?? 0));
  return copy;
}

function DailyTestContent() {
  const { activeCourse } = useCourse();
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({ search: "", subject: "", difficulty: "", status: "", sort: "recommended" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api.get(`/subjects/?${params.toString()}`).then(setSubjects).catch(() => {});
  }, [activeCourse?.id]);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ exam_type: "daily" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    if (filters.search) params.set("search", filters.search);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id, filters.search, filters.subject, filters.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const filtered = filters.status ? tests.filter((t) => t.card_status === filters.status) : tests;
    return sortTests(filtered, filters.sort);
  }, [tests, filters.status, filters.sort]);

  const available = visible.filter((t) => t.card_status === "available");
  const upcoming = visible.filter((t) => t.card_status === "upcoming");
  const rest = visible.filter((t) => t.card_status === "completed" || t.card_status === "missed");

  return (
    <AppShell>
      <Header title="Daily Test" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="daily" />

        <DailyRecommendedCard />

        <PlatformStats examType="daily" typeLabel="Daily Tests" stats={computePlatformStats(tests)} loading={loading && tests.length === 0} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <TestSearchFilterBar examTypeLabel="daily tests" subjects={subjects} filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

            {error && (
              <div className="hm-card p-4 text-center">
                <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load tests.</p>
                <button type="button" onClick={load} className="mt-2 text-sm font-bold text-brand-blue">
                  Try Again
                </button>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="hm-card h-52 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && !error && tests.length === 0 && (
              <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">
                No daily test has been released for {activeCourse?.name || "your course"} yet.
              </p>
            )}
            {!loading && !error && tests.length > 0 && visible.length === 0 && (
              <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">No daily tests match your filters.</p>
            )}

            {!loading && !error && (
              <>
                <TestSection title="Available now" tests={available} />
                <TestSection title="Upcoming" tests={upcoming} />
                <TestSection title="Past" tests={rest} />
              </>
            )}
            <UpgradeBanner />
          </div>
          <TestPageSidebar examType="daily" />
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

function TestSection({ title, tests }) {
  if (tests.length === 0) return null;
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {tests.map((t) => (
          <ExamCard key={t.id} test={t} />
        ))}
      </div>
    </section>
  );
}

export default function DailyTestPage() {
  return (
    <RequireAuth>
      <DailyTestContent />
    </RequireAuth>
  );
}
