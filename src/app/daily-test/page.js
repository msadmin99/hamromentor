"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import ExamCard from "@/components/ExamCard";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import PastTestRow from "@/components/testpage/PastTestRow";
import TestGuidelines from "@/components/testpage/TestGuidelines";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHeaderIcons from "@/components/testpage/TestPageHeaderIcons";
import TestPageHero from "@/components/testpage/TestPageHero";
import UpcomingTestRow from "@/components/testpage/UpcomingTestRow";
import UserTestStats from "@/components/testpage/UserTestStats";
import WhyTakeTests from "@/components/testpage/WhyTakeTests";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const PAST_PAGE_SIZE = 4;
const UPCOMING_PAGE_SIZE = 4;

// Daily Test schedule audit: card_status === "upcoming" was previously
// treated as "today" unconditionally (get_card_status() on the backend
// returns 'upcoming' for ANY future scheduled_start, whether that's later
// today or 20 days from now — see tests_app/serializers.py's own
// docstring). With Admin now able to schedule 20-30 days of Daily Tests
// at once, that put every not-yet-open test into "Today's Daily Tests"
// regardless of date. This is a frontend-only date check — no backend
// field needed, scheduled_start is already on every test.
function isSameCalendarDay(value, reference) {
  if (!value) return true; // no schedule info at all -> never excluded from Today (legacy safety)
  const d = new Date(value);
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth() && d.getDate() === reference.getDate();
}

function DailyTestContent() {
  const { activeCourse } = useCourse();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pastVisible, setPastVisible] = useState(PAST_PAGE_SIZE);
  const [upcomingVisible, setUpcomingVisible] = useState(UPCOMING_PAGE_SIZE);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ exam_type: "daily" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/?${params.toString()}`)
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const today = tests.filter(
    (t) => t.card_status === "available" || t.card_status === "in_progress" || (t.card_status === "upcoming" && isSameCalendarDay(t.scheduled_start, now)),
  );
  const upcoming = tests
    .filter((t) => t.card_status === "upcoming" && t.scheduled_start && !isSameCalendarDay(t.scheduled_start, now))
    .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  const past = tests
    .filter((t) => t.card_status === "completed" || t.card_status === "missed")
    .sort((a, b) => new Date(b.scheduled_start || b.created_at) - new Date(a.scheduled_start || a.created_at));
  const todayLabel = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AppShell>
      <Header title="Daily Test" right={<TestPageHeaderIcons />} courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <TestPageHero examType="daily" />

        {error && (
          <div className="hm-card p-4 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load tests.</p>
            <button type="button" onClick={load} className="mt-2 text-sm font-bold text-brand-blue">
              Try Again
            </button>
          </div>
        )}

        {/*
          Desktop layout update (laptop/desktop only — see the `order-*`
          classes below): the three info panels (Stats / Why Take / Test
          Guidelines) move from a narrow 320px right-hand sidebar into a
          full-width row ABOVE the test grid, and the test cards widen from
          a 4-column to a 3-column grid now that the sidebar column is gone.
          Reference: desktop screenshot supplied 2026-09 ("Jan 2").

          Mobile/tablet (below `lg`) is deliberately unchanged: grid-cols-1
          plus the `order-*` values below reproduce the exact same stacking
          order as before this change — Today's Tests, then Past Tests,
          then Stats, then Why Take, then Guidelines — nothing about the
          small-screen experience moves. The three info components render
          exactly once each (not duplicated for two layouts), just
          repositioned per breakpoint via CSS order, so there's no risk of
          them fetching their data twice.

          Daily Test schedule audit: a new "Upcoming Daily Tests" section
          is inserted between Today's and Past — order-2/lg:order-3 — with
          every later section's order bumped by one accordingly. It never
          renders a Play/Start action (see UpcomingTestRow.js): a
          future-dated Daily Test can't be started until its
          scheduled_start (server-enforced), so it's view-only by design,
          not by an omitted feature.
        */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="order-4 lg:order-1">
            <UserTestStats examType="daily" />
          </div>
          <div className="order-5 lg:order-1">
            <WhyTakeTests examType="daily" />
          </div>
          <div className="order-6 lg:order-1">
            <TestGuidelines />
          </div>

          <section className="order-1 lg:order-2 lg:col-span-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span aria-hidden="true">📅</span> Today&apos;s Daily Tests
                {!loading && (
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text)]">
                    {today.length}
                  </span>
                )}
              </p>
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <span aria-hidden="true">🗓️</span> {todayLabel}
              </span>
            </div>

            {loading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="hm-card h-52 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && !error && today.length === 0 && (
              <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">
                No daily test has been released for {activeCourse?.name || "your course"} today.
              </p>
            )}
            {!loading && !error && today.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {today.map((t) => (
                  <ExamCard key={t.id} test={t} />
                ))}
              </div>
            )}
          </section>

          {!loading && !error && upcoming.length > 0 && (
            <section className="order-2 lg:order-3 lg:col-span-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span aria-hidden="true">📅</span> Upcoming Daily Tests
                <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text)]">
                  {upcoming.length}
                </span>
              </p>
              <div className="hm-card p-4">
                {upcoming.slice(0, upcomingVisible).map((t) => (
                  <UpcomingTestRow key={t.id} test={t} />
                ))}
              </div>
              {upcoming.length > upcomingVisible && (
                <button
                  type="button"
                  onClick={() => setUpcomingVisible((v) => v + UPCOMING_PAGE_SIZE)}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text)]"
                >
                  View More Upcoming Tests ⌄
                </button>
              )}
            </section>
          )}

          {!loading && !error && past.length > 0 && (
            <section className="order-3 lg:order-4 lg:col-span-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span aria-hidden="true">📅</span> Past Daily Tests
              </p>
              <div className="hm-card p-4">
                {past.slice(0, pastVisible).map((t) => (
                  <PastTestRow key={t.id} test={t} />
                ))}
              </div>
              {past.length > pastVisible && (
                <button
                  type="button"
                  onClick={() => setPastVisible((v) => v + PAST_PAGE_SIZE)}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text)]"
                >
                  View More Past Tests ⌄
                </button>
              )}
            </section>
          )}
        </div>

        <div className="hm-card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-green-light text-lg" aria-hidden="true">
              🎯
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">Keep the momentum going!</p>
              <p className="text-xs text-[var(--color-text-muted)]">A little progress every day leads to big results.</p>
            </div>
          </div>
          <Link href="/performance" className="flex-none rounded-xl bg-brand-blue-dark px-5 py-2.5 text-sm font-bold text-white">
            View Progress →
          </Link>
        </div>

        <TestPageFooter />
      </div>
    </AppShell>
  );
}

export default function DailyTestPage() {
  return (
    <RequireAuth>
      <DailyTestContent />
    </RequireAuth>
  );
}
