"use client";

import Link from "next/link";
import { useState } from "react";
import { themeForIndex } from "@/lib/theme";

const INITIAL_COUNT = 5;

function SubjectCard({ subject, theme }) {
  const total = subject.module_count || 0;
  const solved = subject.solved_modules || 0;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

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
          {solved}/{total} modules
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="flex-none text-[10px] font-semibold text-[var(--color-text-muted)]">{pct}%</span>
        </div>
      </div>
      <span className="flex-none text-[var(--color-text-muted)]" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function CustomModuleCard() {
  return (
    <div className="hm-card relative flex items-center gap-3 overflow-hidden p-3.5 opacity-70">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-blue/10 text-xl text-brand-blue" aria-hidden="true">
        ➕
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--color-text)]">Custom Module</p>
        <p className="text-xs text-[var(--color-text-muted)]">Create your own MCQs</p>
      </div>
      <span className="flex-none rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-[9px] font-bold text-[var(--color-text-muted)]">
        SOON
      </span>
    </div>
  );
}

export default function SubjectGrid({ subjects }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = subjects.length > INITIAL_COUNT;
  const visible = expanded ? subjects : subjects.slice(0, INITIAL_COUNT);

  return (
    <section id="subjects">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Your Subjects</p>
        {hasMore && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="text-xs font-bold text-brand-blue">
            {expanded ? "Show Less" : "View All"} ›
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((s, i) => (
          <SubjectCard key={s.id} subject={s} theme={themeForIndex(i)} />
        ))}
        <CustomModuleCard />
      </div>
    </section>
  );
}
