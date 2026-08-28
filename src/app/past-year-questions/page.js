"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import TestPageFooter from "@/components/testpage/TestPageFooter";
import TestPageHero from "@/components/testpage/TestPageHero";
import UniversityCard from "@/components/pyq/UniversityCard";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// Same real support address already used platform-wide (see plans, refund
// policy, subscriptions pages) — no separate "request a paper" backend
// exists yet, so this reuses the existing contact channel rather than
// fabricating a new one.
const SUPPORT_EMAIL = "atech1627@gmail.com";

const INFO_TILES = [
  { icon: "📄", label: "Real Exam Questions", sub: "Past year papers" },
  { icon: "🏛️", label: "University-wise", sub: "Organized collection" },
  { icon: "📝", label: "Exam Pattern Based", sub: "Chapter & topic wise" },
  { icon: "⏱️", label: "Performance Insights", sub: "Track your progress" },
];

const WHY_TILES = [
  { icon: "📝", label: "Understand Exam Pattern", sub: "Get familiar with the actual question pattern & marking." },
  { icon: "✅", label: "Identify Important Topics", sub: "Focus on high-yield topics asked repeatedly." },
  { icon: "✏️", label: "Improve Accuracy", sub: "Practice to reduce mistakes and improve accuracy." },
  { icon: "🎯", label: "Boost Confidence", sub: "Be well-prepared and confident on exam day." },
];

function PastYearQuestionsContent() {
  const { activeCourse } = useCourse();
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/universities/?${params.toString()}`)
      .then(setUniversities)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeCourse?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = search.trim()
    ? universities.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase()))
    : universities;

  return (
    <AppShell>
      <Header title="Past Year Questions" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page flex flex-col gap-5">
        <div className="hm-card p-5">
          <TestPageHero examType="pyq" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {INFO_TILES.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-base" aria-hidden="true">
                  {t.icon}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs font-bold text-[var(--color-text)]">{t.label}</p>
                  <p className="truncate text-[11px] text-[var(--color-text-muted)]">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">Choose a University</p>
              <p className="text-xs text-[var(--color-text-muted)]">Select a university to explore past year question papers.</p>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past year questions…"
            aria-label="Search universities"
            className="hm-input mb-3 max-w-sm"
          />

          {error && (
            <div className="hm-card p-4 text-center">
              <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load universities.</p>
              <button type="button" onClick={load} className="mt-2 text-sm font-bold text-brand-blue">
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="hm-card h-36 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !error && universities.length === 0 && (
            <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">
              No past year question sets available for {activeCourse?.name || "your course"} yet.
            </p>
          )}
          {!loading && !error && universities.length > 0 && visible.length === 0 && (
            <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">No universities match your search.</p>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((university) => (
                <UniversityCard key={university.name} university={university} />
              ))}
            </div>
          )}
        </div>

        <div className="hm-card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">Can&apos;t find the paper you&apos;re looking for?</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              We&apos;re constantly adding more past year papers. Request a paper and we&apos;ll notify you when it&apos;s available.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Past Year Paper Request")}`}
            className="flex-none text-sm font-bold text-brand-blue"
          >
            Request a Paper →
          </a>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Why practice past year questions?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WHY_TILES.map((t) => (
              <div key={t.label} className="hm-card flex flex-col gap-1.5 p-3.5">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-base" aria-hidden="true">
                  {t.icon}
                </span>
                <p className="text-xs font-bold text-[var(--color-text)]">{t.label}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <TestPageFooter />
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
