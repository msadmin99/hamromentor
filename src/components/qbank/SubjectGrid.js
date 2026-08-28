"use client";

import Link from "next/link";
import { useState } from "react";
import { themeForIndex } from "@/lib/theme";

const INITIAL_COUNT = 5;

function SubjectCard({ subject, theme }) {
  const pct = subject.percent_practiced ?? 0;

  return (
    <Link
      href={subject.has_access ? `/qbank/${subject.slug}` : "/plans"}
      className="hm-card relative flex items-center gap-3 overflow-hidden p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className={`absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-25 ${theme.corner}`} aria-hidden="true" />
      {!subject.has_access && (
        <span className="absolute right-2 top-2 z-10 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
          🔒 PRO
        </span>
      )}
      <span
        className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-xl ${theme.iconBg} ${theme.fg}`}
        aria-hidden="true"
      >
        {subject.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">{subject.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {subject.question_count} question{subject.question_count === 1 ? "" : "s"} · {subject.module_count} chapter
          {subject.module_count === 1 ? "" : "s"}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="flex-none text-[10px] font-semibold text-[var(--color-text-muted)]">{pct}% practiced</span>
        </div>
      </div>
      <span className="flex-none text-[var(--color-text-muted)]" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function SubjectCardSkeleton() {
  return (
    <div className="hm-card flex animate-pulse items-center gap-3 p-3.5">
      <div className="h-11 w-11 flex-none rounded-full bg-[var(--color-surface-muted)]" />
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-24 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-2.5 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-surface-muted)]" />
      </div>
    </div>
  );
}

export default function SubjectGrid({ subjects, loading }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = subjects.length > INITIAL_COUNT;
  const visible = expanded ? subjects : subjects.slice(0, INITIAL_COUNT);

  return (
    <section id="subjects">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Browse by Subject</p>
          <p className="text-xs text-[var(--color-text-muted)]">Choose a subject to practice by topic</p>
        </div>
        {hasMore && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="flex-none text-xs font-bold text-brand-blue">
            {expanded ? "Show Less" : "View all subjects"} ›
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SubjectCardSkeleton key={i} />)
          : visible.map((s, i) => <SubjectCard key={s.id} subject={s} theme={themeForIndex(i)} />)}
      </div>
      {!loading && subjects.length === 0 && (
        <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">
          No subjects available for this course yet.
        </p>
      )}
    </section>
  );
}
