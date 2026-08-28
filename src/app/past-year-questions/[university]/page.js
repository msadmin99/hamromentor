"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
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

function PastYearQuestionsUniversityContent() {
  const { university } = useParams();
  const decodedUniversity = decodeURIComponent(university);
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // No `year` filter — every year's question set for this university shows
    // together on one page (each card carries its own year badge, see ExamCard).
    const params = new URLSearchParams({ exam_type: "pyq", university: decodedUniversity });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .finally(() => setLoading(false));
  }, [decodedUniversity, activeCourse?.id]);

  return (
    <AppShell>
      <Header title={decodedUniversity} showBack />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="pyq" />

        <PlatformStats examType="pyq" typeLabel="Question Sets" stats={computePlatformStats(tests)} loading={loading} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {loading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="hm-card h-52 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && tests.length === 0 && (
              <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">No question sets found for {decodedUniversity}.</p>
            )}
            {!loading && tests.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {tests.map((t) => (
                  <ExamCard key={t.id} test={t} />
                ))}
              </div>
            )}
            <UpgradeBanner />
          </div>
          <TestPageSidebar examType="pyq" />
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

export default function PastYearQuestionsUniversityPage() {
  return (
    <RequireAuth>
      <PastYearQuestionsUniversityContent />
    </RequireAuth>
  );
}
