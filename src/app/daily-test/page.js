"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import PlatformStats from "@/components/testpage/PlatformStats";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHero from "@/components/testpage/TestPageHero";
import TestPageSidebar from "@/components/testpage/TestPageSidebar";
import UpgradeBanner from "@/components/testpage/UpgradeBanner";
import { computePlatformStats } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function DailyTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ exam_type: "daily" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .finally(() => setLoading(false));
  }, [activeCourse?.id]);

  const available = tests.filter((t) => t.card_status === "available");
  const upcoming = tests.filter((t) => t.card_status === "upcoming");
  const rest = tests.filter((t) => t.card_status === "completed" || t.card_status === "missed");

  return (
    <AppShell>
      <Header title="Daily Test" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="daily" />

        <PlatformStats examType="daily" typeLabel="Daily Tests" stats={computePlatformStats(tests)} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading daily tests…</p>}
            {!loading && tests.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">
                No daily test has been released for {activeCourse?.name || "your course"} yet.
              </p>
            )}

            <TestSection title="Available now" tests={available} />
            <TestSection title="Upcoming" tests={upcoming} />
            <TestSection title="Past" tests={rest} />
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
