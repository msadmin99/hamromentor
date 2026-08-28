"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** Featured Mock Test hero — real "most comprehensive" pick from
 * GET /tests/recommended/?exam_type=mock, with a real distinct-attempt
 * count instead of a fabricated "98% students attempted". */
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
        <div className="h-3 w-32 rounded bg-white/20" />
        <div className="mt-3 h-7 w-64 rounded bg-white/20" />
        <div className="mt-6 h-10 w-40 rounded-xl bg-white/20" />
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

  const badges = [];
  if (rec.attempted_count) badges.push(`${rec.attempted_count} student${rec.attempted_count === 1 ? "" : "s"} attempted`);
  badges.push("High Yield");
  badges.push("Balanced Coverage");

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md"
      style={{ background: "linear-gradient(135deg, var(--color-brand-blue-dark) 0%, var(--color-brand-blue) 100%)" }}
    >
      <span className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" aria-hidden="true" />
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/70">
        <span aria-hidden="true">🎯</span> Recommended For You
      </p>
      <h3 className="text-2xl font-extrabold">{test.title}</h3>
      <p className="mt-1 max-w-md text-sm text-white/80">{test.description || "Most comprehensive test available for your course."}</p>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="font-bold">
          {test.question_count} <span className="font-normal text-white/70">Questions</span>
        </span>
        <span className="font-bold">
          {test.duration_minutes} min <span className="font-normal text-white/70">Duration</span>
        </span>
        {test.difficulty && <span className="font-bold">{DIFFICULTY_LABEL[test.difficulty] || test.difficulty}</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((b) => (
          <span key={b} className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            {b}
          </span>
        ))}
      </div>

      <Link
        href={`/tests/${test.id}`}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-blue-dark transition hover:brightness-95"
      >
        Start Recommended Test
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
