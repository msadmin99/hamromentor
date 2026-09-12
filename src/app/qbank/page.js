"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
// TEMPORARY, investigation-only — see ScrollDiagnostics.js's own docstring.
// Only ever mounts behind an explicit ?debug=1 query param (below); a real
// student visiting /qbank normally never renders or is affected by it.
import ScrollDiagnostics from "@/components/qbank/ScrollDiagnostics";
import SmartPracticeGrid from "@/components/qbank/SmartPracticeGrid";
import SubjectGrid from "@/components/qbank/SubjectGrid";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function QBankContent() {
  const { activeCourse } = useCourse();
  const [subjects, setSubjects] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "1";
  const [preloadMode, setPreloadMode] = useState(false);
  const dataReady = !loading && dashboardStats !== null;

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
    <AppShell
      header={
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
      }
    >
      {debugMode && preloadMode && !dataReady ? (
        // Phase 5 diagnostic only (debugMode + the operator's own toggle,
        // never for a real visitor): render nothing until this page's own
        // two fetches have both resolved, eliminating any mid-scroll async
        // insertion for THIS page's state (NextPracticeCard/
        // RecommendedForYou still fetch independently — an honest limit of
        // this approximation, not a full guarantee every descendant is
        // ready too).
        <div className="hm-page p-8 text-center text-sm text-[var(--color-text-muted)]">
          Phase 5 diagnostic: waiting for subjects + dashboard stats before rendering…
        </div>
      ) : (
        <div className="hm-page flex flex-col gap-5">
          <QBankHero accuracy={dashboardStats?.accuracy} attempted={dashboardStats?.attempted} />

          <QBankSearch />

          <NextPracticeCard />

          <SmartPracticeGrid stats={dashboardStats} loading={loading && !dashboardStats} />

          <SubjectGrid subjects={subjects} loading={loading} />

          <RecommendedForYou />

          <ProgressSummary stats={dashboardStats} loading={loading && !dashboardStats} />

          <QuickPractice />
        </div>
      )}

      {debugMode && <ScrollDiagnostics dataReady={dataReady} preload={preloadMode} onTogglePreload={setPreloadMode} />}
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
