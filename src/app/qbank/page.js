"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { BookmarkIcon, SearchIcon, UserIcon } from "@/components/icons";
import NextPracticeCard from "@/components/qbank/NextPracticeCard";
import ProgressSummary from "@/components/qbank/ProgressSummary";
import QBankHero from "@/components/qbank/QBankHero";
import QBankSearch from "@/components/qbank/QBankSearch";
import QuickPractice from "@/components/qbank/QuickPractice";
import RecommendedForYou from "@/components/qbank/RecommendedForYou";
import SmartPracticeGrid from "@/components/qbank/SmartPracticeGrid";
import SubjectGrid from "@/components/qbank/SubjectGrid";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function QBankContent() {
  const { activeCourse } = useCourse();
  const [subjects, setSubjects] = useState([]);
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

    const dashParams = new URLSearchParams();
    if (activeCourse?.id) dashParams.set("course", activeCourse.id);
    api
      .get(`/questions/dashboard/?${dashParams.toString()}`)
      .then(setDashboardStats)
      .catch(() => setDashboardStats(null));
  }, [activeCourse?.id]);

  function focusSearch() {
    const input = document.getElementById("qbank-search-input");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }

  return (
    <AppShell>
      <Header
        title="Dr Gutka"
        right={
          <>
            <Link href="/qbank/bookmarks" aria-label="Bookmarks">
              <BookmarkIcon />
            </Link>
            <button type="button" onClick={focusSearch} aria-label="Search questions">
              <SearchIcon />
            </button>
            <Link href="/profile" aria-label="Profile">
              <UserIcon />
            </Link>
          </>
        }
        courseSwitcher={<CourseSwitcher />}
      />

      <div className="hm-page flex flex-col gap-5">
        <QBankHero />

        <QBankSearch />

        <NextPracticeCard />

        <SmartPracticeGrid stats={dashboardStats} loading={loading && !dashboardStats} />

        <SubjectGrid subjects={subjects} loading={loading} />

        <RecommendedForYou />

        <ProgressSummary stats={dashboardStats} loading={loading && !dashboardStats} />

        <QuickPractice />
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
