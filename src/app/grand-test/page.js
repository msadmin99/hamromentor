"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import GrandTestHero from "@/components/testpage/GrandTestHero";
import PlatformStats from "@/components/testpage/PlatformStats";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHero from "@/components/testpage/TestPageHero";
import TestPageSidebar from "@/components/testpage/TestPageSidebar";
import UpgradeBanner from "@/components/testpage/UpgradeBanner";
import { computePlatformStats } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function GrandTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ exam_type: "grand" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
      <Header title="Grand Test" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="grand" />

        <GrandTestHero onPurchased={load} />

        <PlatformStats examType="grand" typeLabel="Grand Tests" stats={computePlatformStats(tests)} loading={loading && tests.length === 0} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {error && (
              <div className="hm-card p-4 text-center">
                <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load tests.</p>
                <button type="button" onClick={load} className="mt-2 text-sm font-bold text-brand-blue">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && tests.length > 1 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">All Grand Tests</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {tests.map((t) => (
                    <ExamCard key={t.id} test={t} />
                  ))}
                </div>
              </>
            )}

            <UpgradeBanner />
          </div>
          <TestPageSidebar examType="grand" />
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

export default function GrandTestPage() {
  return (
    <RequireAuth>
      <GrandTestContent />
    </RequireAuth>
  );
}
