"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

function PastYearQuestionsUniversityContent() {
  const { university } = useParams();
  const decodedUniversity = decodeURIComponent(university);
  const { activeCourse } = useCourse();
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ university: decodedUniversity });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/years/?${params.toString()}`)
      .then(setYears)
      .finally(() => setLoading(false));
  }, [decodedUniversity, activeCourse?.id]);

  return (
    <AppShell>
      <Header title={decodedUniversity} subtitle="Select a year" showBack />

      <div className="hm-page flex flex-col gap-4">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading years…</p>}
        {!loading && years.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No question sets found for {decodedUniversity}.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {years.map((year) => (
            <Link
              key={year}
              href={`/past-year-questions/${university}/${year}`}
              className="hm-card flex flex-col items-center gap-1 py-6"
            >
              <span className="text-2xl">📚</span>
              <span className="text-sm font-bold text-[var(--color-text)]">{year}</span>
            </Link>
          ))}
        </div>
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
