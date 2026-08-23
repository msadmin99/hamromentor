"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import TestPageHero from "@/components/testpage/TestPageHero";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function PastYearQuestionsContent() {
  const { activeCourse } = useCourse();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/universities/?${params.toString()}`)
      .then(setUniversities)
      .finally(() => setLoading(false));
  }, [activeCourse?.id]);

  return (
    <AppShell>
      <Header title="Past Year Questions" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-4">
        <TestPageHero examType="pyq" />

        <div>
          <p className="mb-2 text-sm font-bold text-[var(--color-text)]">Choose a University</p>
          {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
          {!loading && universities.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">
              No past year question sets available for {activeCourse?.name || "your course"} yet.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {universities.map((university) => (
              <Link
                key={university}
                href={`/past-year-questions/${encodeURIComponent(university)}`}
                className="hm-card flex flex-col items-center gap-2 py-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
                  aria-hidden="true"
                >
                  🏫
                </span>
                <span className="text-sm font-bold text-[var(--color-text)]">{university}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PastYearQuestionsPage() {
  return (
    <RequireAuth>
      <PastYearQuestionsContent />
    </RequireAuth>
  );
}
