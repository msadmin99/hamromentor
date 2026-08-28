"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Compact greeting + real Daily Streak (from /performance/overview/'s
 * kpis.current_streak_days) — the primary "Start Practice" CTA now lives on
 * NextPracticeCard below, so this section stays short per the reference
 * design instead of being a tall standalone hero. */
export default function QBankHero() {
  const { user } = useAuth();
  const { activeCourse } = useCourse();
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then((data) => setStreak(data?.kpis?.current_streak_days ?? 0))
      .catch(() => setStreak(null));
  }, [activeCourse?.id]);

  const greeting = greetingForHour(new Date().getHours());
  const name = user?.first_name || "Student";

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          {greeting}, {name}! <span aria-hidden="true">👋</span>
        </p>
        <h1 className="mt-0.5 text-lg font-extrabold leading-tight text-[var(--color-text)] sm:text-xl">
          What would you like to practice today?
        </h1>
      </div>

      {streak != null && streak > 0 && (
        <div className="flex-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-center shadow-sm">
          <p className="text-sm font-extrabold text-[var(--color-text)]">
            <span aria-hidden="true">🔥</span> {streak} Day Streak
          </p>
          <p className="text-[11px] font-semibold text-brand-green">Keep it up!</p>
        </div>
      )}
    </div>
  );
}
