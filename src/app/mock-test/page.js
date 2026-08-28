"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import MockRecommendedCard from "@/components/testpage/MockRecommendedCard";
import StatusTabs from "@/components/testpage/StatusTabs";
import TestGuidelines from "@/components/testpage/TestGuidelines";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHeaderIcons from "@/components/testpage/TestPageHeaderIcons";
import TestPageHero from "@/components/testpage/TestPageHero";
import TestProgressSummaryCard from "@/components/testpage/TestProgressSummaryCard";
import TestStatsRow from "@/components/testpage/TestStatsRow";
import WhyTakeTests from "@/components/testpage/WhyTakeTests";
import { matchesStatusTab, statusBreakdown } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function MockTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("all");

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ exam_type: "mock" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => tests.filter((t) => matchesStatusTab(t, tab)), [tests, tab]);
  const counts = useMemo(() => statusBreakdown(tests), [tests]);

  return (
    <AppShell>
      <Header title="Mock Test" right={<TestPageHeaderIcons />} courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <TestPageHero examType="mock" />

        <MockRecommendedCard />

        <TestStatsRow examType="mock" available={tests.length} loading={loading && tests.length === 0} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <StatusTabs value={tab} onChange={setTab} counts={counts} />

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
                No mock tests are available for {activeCourse?.name || "your course"} yet.
              </p>
            )}
            {!loading && !error && tests.length > 0 && visible.length === 0 && (
              <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">No mock tests in this category yet.</p>
            )}

            {!loading && !error && visible.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((t) => (
                  <ExamCard key={t.id} test={t} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <TestProgressSummaryCard tests={tests} loading={loading && tests.length === 0} />
            <WhyTakeTests examType="mock" />
            <TestGuidelines />
          </div>
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

export default function MockTestPage() {
  return (
    <RequireAuth>
      <MockTestContent />
    </RequireAuth>
  );
}
