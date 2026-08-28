"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";
import StreakCard from "@/components/home/StreakCard";
import { EXAM_TYPE_META, EXAM_TYPE_PAGE_META } from "./examTypeMeta";

/** Compact page header — plain title + one-line tagline, matching the
 * reference design (Header.js already renders the actual <h1> page title,
 * e.g. "Mock Test" — this is the subtitle row directly under it). Daily
 * Test alone shows a real streak (same GET /performance/overview/ ->
 * kpis.current_streak_days pattern already used by QBankHero.js). */
export default function TestPageHero({ examType }) {
  const { activeCourse } = useCourse();
  const cardMeta = EXAM_TYPE_META[examType] || {};
  const pageMeta = EXAM_TYPE_PAGE_META[examType] || {};
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    if (examType !== "daily") return;
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then((data) => setStreak(data?.kpis?.current_streak_days ?? 0))
      .catch(() => setStreak(null));
  }, [examType, activeCourse?.id]);

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold leading-tight text-[var(--color-text)] sm:text-xl">
          {cardMeta.subtitle || pageMeta.shortLabel || "Tests"}
        </h2>
        {pageMeta.tagline && <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{pageMeta.tagline}</p>}
      </div>
      {examType === "daily" && streak != null && streak > 0 && <StreakCard days={streak} />}
    </div>
  );
}
