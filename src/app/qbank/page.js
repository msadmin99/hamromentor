"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { BookmarkIcon, SearchIcon, UserIcon } from "@/components/icons";
import QBankHero from "@/components/qbank/QBankHero";
import QBankQuickStats from "@/components/qbank/QBankQuickStats";
import QBankSearch from "@/components/qbank/QBankSearch";
import RecommendedForYou from "@/components/qbank/RecommendedForYou";
import SmartPractice from "@/components/qbank/SmartPractice";
import StatusCards from "@/components/qbank/StatusCards";
import SubjectGrid from "@/components/qbank/SubjectGrid";
import TestGuidelines from "@/components/testpage/TestGuidelines";
import UpgradeBanner from "@/components/testpage/UpgradeBanner";
import UserTestStats from "@/components/testpage/UserTestStats";
import WhyTakeTests from "@/components/testpage/WhyTakeTests";
import { computePlatformStats } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function QBankContent() {
  const { activeCourse } = useCourse();
  const [subjects, setSubjects] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/subjects/?${params.toString()}`)
      .then(setSubjects)
      .finally(() => setLoading(false));

    const testParams = new URLSearchParams({ exam_type: "qbank" });
    if (activeCourse?.id) testParams.set("course", activeCourse.id);
    api
      .get(`/tests/?${testParams.toString()}`)
      .then(setPracticeTests)
      .catch(() => {});

    const dashParams = new URLSearchParams();
    if (activeCourse?.id) dashParams.set("course", activeCourse.id);
    api
      .get(`/questions/dashboard/?${dashParams.toString()}`)
      .then(setDashboardStats)
      .catch(() => setDashboardStats(null));
  }, [activeCourse?.id]);

  function scrollToSubjects() {
    document.getElementById("subjects")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell>
      <Header
        title="QBank Edition 8"
        right={
          <>
            <Link href="/qbank/bookmarks" aria-label="Bookmarks">
              <BookmarkIcon />
            </Link>
            <SearchIcon />
            <Link href="/profile" aria-label="Profile">
              <UserIcon />
            </Link>
          </>
        }
        courseSwitcher={<CourseSwitcher />}
      />

      <div className="hm-page flex flex-col gap-4">
        <QBankHero onStartPracticing={scrollToSubjects} />

        <QBankSearch />

        <RecommendedForYou />

        <StatusCards stats={dashboardStats} />

        <SmartPractice />

        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Link href="/qbank/mistakes" className="hm-card flex items-center justify-between gap-2 p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">❌ My Mistakes</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">Turn mistakes into marks</p>
            </div>
            <span className="flex-none text-[var(--color-text-muted)]" aria-hidden="true">
              ›
            </span>
          </Link>
          <Link href="/qbank/bookmarks" className="hm-card flex items-center justify-between gap-2 p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">🔖 Bookmarks</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">Saved for later</p>
            </div>
            <span className="flex-none text-[var(--color-text-muted)]" aria-hidden="true">
              ›
            </span>
          </Link>
        </div>

        <QBankQuickStats stats={computePlatformStats(practiceTests)} />

        <div>
          <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Browse Questions</p>
          {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading subjects…</p>}
          {!loading && <SubjectGrid subjects={subjects} />}
        </div>

        <UpgradeBanner />

        {practiceTests.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Practice Tests
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {practiceTests.map((t) => (
                <ExamCard key={t.id} test={t} />
              ))}
            </div>
          </section>
        )}

        <UserTestStats
          examType="qbank"
          headerExtra={
            <Link href="/performance" className="flex-none text-xs font-bold text-brand-blue">
              Detailed Insights ›
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WhyTakeTests examType="qbank" />
          <TestGuidelines />
        </div>
      </div>
    </AppShell>
  );
}

export default function QBankPage() {
  return (
    <RequireAuth>
      <QBankContent />
    </RequireAuth>
  );
}
