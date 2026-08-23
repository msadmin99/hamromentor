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

function GrandTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ exam_type: "grand" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .finally(() => setLoading(false));
  }, [activeCourse?.id]);

  return (
    <AppShell>
      <Header title="Grand Test" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="grand" />

        <PlatformStats examType="grand" typeLabel="Grand Tests" stats={computePlatformStats(tests)} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading grand tests…</p>}
            {!loading && tests.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">
                No grand test is scheduled for {activeCourse?.name || "your course"} yet.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {tests.map((t) => (
                <ExamCard key={t.id} test={t} />
              ))}
            </div>
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
