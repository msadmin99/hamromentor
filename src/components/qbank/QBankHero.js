"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

function greetingForHour(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Greeting hero + real Daily Streak (from /performance/overview/'s
 * kpis.current_streak_days — the same activity-streak logic the My
 * Performance page uses, not a fabricated number). */
export default function QBankHero({ onStartPracticing }) {
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
    <div className="hm-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {greeting}, {name}! 👋
          </p>
          {/* Header.js already renders the page's <h1> ("Dr Gutka") — this is a section heading, not a second page title. */}
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-[var(--color-text)] sm:text-3xl">
            Let&apos;s make <span className="text-brand-blue">today</span> count!
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Unlimited practice. Detailed solutions. Smarter revision.
          </p>
          <button
            type="button"
            onClick={onStartPracticing}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Start Practicing
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="flex flex-none items-center justify-center gap-4 sm:justify-start lg:justify-center">
          <div
            className="flex h-24 w-24 flex-none items-center justify-center rounded-full text-4xl shadow-sm sm:h-28 sm:w-28 sm:text-5xl"
            style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
            aria-hidden="true"
          >
            🎯
          </div>

          <div className="flex-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)]">🔥 Daily Streak</p>
            <p className="mt-1 text-2xl font-extrabold text-brand-blue">{streak ?? "—"}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">days</p>
            <p className="mt-1 text-[10px] font-semibold text-brand-green">Keep it up!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
