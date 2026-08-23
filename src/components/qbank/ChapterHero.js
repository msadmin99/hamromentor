"use client";

import Link from "next/link";

/** Chapter drill-down hero — mirrors the reference "N MCQs / stats row /
 * SOLVE NOW" card, driven entirely by real Chapter data (mcq_count,
 * solved_count already computed server-side in ChapterSerializer). */
export default function ChapterHero({ chapter, solveHref, icon, theme }) {
  const total = chapter.mcq_count || 0;
  const solved = chapter.solved_count || 0;
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <div className="hm-card relative overflow-hidden p-5 sm:p-6">
      <span className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 ${theme.corner}`} aria-hidden="true" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className={`flex h-14 w-14 flex-none items-center justify-center rounded-full text-2xl ${theme.iconBg} ${theme.fg}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">{total} MCQs</p>
            <p className="text-sm text-[var(--color-text-muted)]">Solve now and test your knowledge</p>
          </div>
        </div>

        <Link
          href={solveHref}
          className="flex-none rounded-xl bg-brand-blue px-6 py-2.5 text-center text-sm font-bold text-white transition hover:brightness-110 sm:w-auto"
        >
          SOLVE NOW <span aria-hidden="true">›</span>
        </Link>
      </div>

      <div className="relative mt-5 grid grid-cols-3 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-2 pr-2">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-blue/10 text-sm text-brand-blue" aria-hidden="true">
            📄
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-extrabold text-[var(--color-text)]">{total}</p>
            <p className="truncate text-[10px] text-[var(--color-text-muted)]">Total MCQs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-green-light text-sm text-brand-green" aria-hidden="true">
            ✅
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-extrabold text-[var(--color-text)]">{solved}</p>
            <p className="truncate text-[10px] text-[var(--color-text-muted)]">Solved</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600" aria-hidden="true">
            🎯
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-extrabold text-[var(--color-text)]">{pct}%</p>
            <p className="truncate text-[10px] text-[var(--color-text-muted)]">Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
