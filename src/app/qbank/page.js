"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { SearchIcon } from "@/components/icons";
import PlatformStats from "@/components/testpage/PlatformStats";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageSidebar from "@/components/testpage/TestPageSidebar";
import UpgradeBanner from "@/components/testpage/UpgradeBanner";
import { computePlatformStats } from "@/components/testpage/examTypeMeta";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function QBankContent() {
  const { activeCourse } = useCourse();
  const [subjects, setSubjects] = useState([]);
  const [practiceTests, setPracticeTests] = useState([]);
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
  }, [activeCourse?.id]);

  return (
    <AppShell>
      <Header title="QBank Edition 8" right={<SearchIcon />} courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <PlatformStats examType="qbank" typeLabel="Practice Tests" stats={computePlatformStats(practiceTests)} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="hm-card p-3">
                <p className="text-sm font-semibold text-[var(--color-text)]">🔖 Bookmarks</p>
                <p className="text-xs text-[var(--color-text-muted)]">Saved for later</p>
              </div>
              <div className="hm-card p-3">
                <p className="text-sm font-semibold text-[var(--color-text)]">➕ Custom Module</p>
                <p className="text-xs text-[var(--color-text-muted)]">Customised MCQs</p>
              </div>
            </div>

            {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading subjects…</p>}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={s.has_access ? `/qbank/${s.slug}` : "/plans"}
                  className="hm-card relative flex items-start gap-2.5 p-3"
                >
                  {!s.has_access && (
                    <span className="absolute right-2 top-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                      🔒 PRO
                    </span>
                  )}
                  <span className="text-xl">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{s.name}</p>
                    <p className="text-xs text-brand-blue">
                      {s.solved_modules}/{s.module_count} modules
                    </p>
                  </div>
                </Link>
              ))}
            </div>

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

            <UpgradeBanner />
          </div>
          <TestPageSidebar examType="qbank" />
        </div>

        <TestPageFooter />
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
