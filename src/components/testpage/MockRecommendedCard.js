"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** Featured Mock Test — real "most comprehensive" pick from
 * GET /tests/recommended/?exam_type=mock. Restyled to a light, minimal
 * card (border + subtle icon) matching the reference's premium/understated
 * direction instead of a heavy dark gradient hero. */
export default function MockRecommendedCard() {
  const { activeCourse } = useCourse();
  const [rec, setRec] = useState(undefined);
  const [test, setTest] = useState(null);

  useEffect(() => {
    setRec(undefined);
    setTest(null);
    const params = new URLSearchParams({ exam_type: "mock" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/recommended/?${params.toString()}`)
      .then((data) => {
        setRec(data);
        if (data.test_id) api.get(`/tests/${data.test_id}/`).then(setTest);
      })
      .catch(() => setRec(null));
  }, [activeCourse?.id]);

  if (rec === undefined) {
    return (
      <div className="hm-card animate-pulse p-6">
        <div className="h-3 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-3 h-7 w-64 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-6 h-10 w-40 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  if (!rec?.test_id || !test) {
    return (
      <div className="hm-card p-6 text-center">
        <p className="text-base font-extrabold text-[var(--color-text)]">No mock tests available yet</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">We&apos;ll feature one here as soon as it&apos;s published.</p>
      </div>
    );
  }

  return (
    <div className="hm-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue">
          <span aria-hidden="true">🎯</span> Real Exam Simulation
        </p>
        <h3 className="text-xl font-extrabold text-[var(--color-text)]">{test.title}</h3>
        <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
          {test.description || "Full-length mock test covering your complete syllabus."}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          <span className="font-semibold text-[var(--color-text)]">
            {test.question_count} <span className="font-normal text-[var(--color-text-muted)]">Questions</span>
          </span>
          <span className="font-semibold text-[var(--color-text)]">
            {test.duration_minutes} <span className="font-normal text-[var(--color-text-muted)]">Minutes</span>
          </span>
          {test.difficulty && <span className="font-semibold text-[var(--color-text)]">{DIFFICULTY_LABEL[test.difficulty] || test.difficulty}</span>}
          {rec.attempted_count > 0 && (
            <span className="font-normal text-[var(--color-text-muted)]">{rec.attempted_count} students attempted</span>
          )}
        </div>
      </div>

      <Link
        href={`/tests/${test.id}`}
        className="flex-none rounded-xl bg-brand-blue px-6 py-3 text-center text-sm font-bold text-white transition hover:brightness-110"
      >
        Start Test →
      </Link>
    </div>
  );
}
