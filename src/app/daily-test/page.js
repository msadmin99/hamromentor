"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import PastTestRow from "@/components/testpage/PastTestRow";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHeaderIcons from "@/components/testpage/TestPageHeaderIcons";
import TestPageHero from "@/components/testpage/TestPageHero";
import TestPageSidebar from "@/components/testpage/TestPageSidebar";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const PAST_PAGE_SIZE = 4;

function DailyTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pastVisible, setPastVisible] = useState(PAST_PAGE_SIZE);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ exam_type: "daily" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = tests.filter((t) => t.card_status === "available" || t.card_status === "upcoming" || t.card_status === "in_progress");
  const past = tests
    .filter((t) => t.card_status === "completed" || t.card_status === "missed")
    .sort((a, b) => new Date(b.scheduled_start || b.created_at) - new Date(a.scheduled_start || a.created_at));
  const todayLabel = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AppShell>
      <Header title="Daily Test" right={<TestPageHeaderIcons />} courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <TestPageHero examType="daily" />

        {error && (
          <div className="hm-card p-4 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load tests.</p>
            <button type="button" onClick={load} className="mt-2 text-sm font-bold text-brand-blue">
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <span aria-hidden="true">📅</span> Today&apos;s Daily Tests
                  {!loading && (
                    <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text)]">
                      {today.length}
                    </span>
                  )}
                </p>
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <span aria-hidden="true">🗓️</span> {todayLabel}
                </span>
              </div>

              {loading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="hm-card h-52 animate-pulse" />
                  ))}
                </div>
              )}
              {!loading && !error && today.length === 0 && (
                <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">
                  No daily test has been released for {activeCourse?.name || "your course"} today.
                </p>
              )}
              {!loading && !error && today.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {today.map((t) => (
                    <ExamCard key={t.id} test={t} />
                  ))}
                </div>
              )}
            </section>

            {!loading && !error && past.length > 0 && (
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <span aria-hidden="true">📅</span> Past Daily Tests
                </p>
                <div className="hm-card p-4">
                  {past.slice(0, pastVisible).map((t) => (
                    <PastTestRow key={t.id} test={t} />
                  ))}
                </div>
                {past.length > pastVisible && (
                  <button
                    type="button"
                    onClick={() => setPastVisible((v) => v + PAST_PAGE_SIZE)}
                    className="mt-2 w-full rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text)]"
                  >
                    View More Past Tests ⌄
                  </button>
                )}
              </section>
            )}
          </div>

          <TestPageSidebar examType="daily" />
        </div>

        <div className="hm-card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-green-light text-lg" aria-hidden="true">
              🎯
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">Keep the momentum going!</p>
              <p className="text-xs text-[var(--color-text-muted)]">A little progress every day leads to big results.</p>
            </div>
          </div>
          <Link href="/performance" className="flex-none rounded-xl bg-brand-blue-dark px-5 py-2.5 text-sm font-bold text-white">
            View Progress →
          </Link>
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

export default function DailyTestPage() {
  return (
    <RequireAuth>
      <DailyTestContent />
    </RequireAuth>
  );
}
