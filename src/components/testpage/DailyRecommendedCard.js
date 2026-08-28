"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Moderate", hard: "Hard" };

/** "Your Next Practice"-equivalent for Daily Test — real weak-subject match
 * from GET /tests/recommended/?exam_type=daily, detail from GET /tests/{id}/.
 * Linear accuracy bar (not a ring) matches the reference exactly. */
export default function DailyRecommendedCard() {
  const { activeCourse } = useCourse();
  const [rec, setRec] = useState(undefined); // undefined = loading, null = none
  const [test, setTest] = useState(null);

  useEffect(() => {
    setRec(undefined);
    setTest(null);
    const params = new URLSearchParams({ exam_type: "daily" });
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
      <div className="hm-card animate-pulse p-5">
        <div className="h-3 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-3 h-6 w-48 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-6 h-10 w-40 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  if (!rec?.test_id || !test) {
    return (
      <div className="hm-card p-5 text-center">
        <p className="text-base font-extrabold text-[var(--color-text)]">You&apos;re all caught up 🎉</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          No daily test is waiting for you right now — check back soon for a fresh one.
        </p>
      </div>
    );
  }

  const accuracy = rec.accuracy_pct != null ? Math.round(rec.accuracy_pct) : null;

  return (
    <div className="hm-card p-5" style={{ background: "linear-gradient(135deg, var(--color-brand-green-light) 0%, rgba(255,255,255,0.4) 100%)" }}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span aria-hidden="true">⏰</span> Recommended For You
      </p>
      <h3 className="text-xl font-extrabold text-[var(--color-text)]">{test.title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {rec.weak_area ? "Recommended based on your recent performance" : "A fresh test to get you started"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="font-bold text-[var(--color-text)]">
          {test.question_count} <span className="font-normal text-[var(--color-text-muted)]">Questions</span>
        </span>
        <span className="font-bold text-[var(--color-text)]">
          {test.duration_minutes} <span className="font-normal text-[var(--color-text-muted)]">Minutes</span>
        </span>
        {test.difficulty && (
          <span className="font-bold text-[var(--color-text)]">{DIFFICULTY_LABEL[test.difficulty] || test.difficulty}</span>
        )}
      </div>

      {accuracy != null && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-[var(--color-text-muted)]">Your accuracy in this topic: {accuracy}%</p>
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/60">
            <div className="h-full rounded-full bg-brand-green" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
      )}

      <Link
        href={`/tests/${test.id}`}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue-dark px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
      >
        Start Recommended Test
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
