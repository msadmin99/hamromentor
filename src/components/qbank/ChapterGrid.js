"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { themeForIndex } from "@/lib/theme";

/** Subject drill-down grid — one card per Chapter ("Unit" in the UI),
 * reusing the same progress-bar presentation as the QBank home SubjectGrid
 * so the visual language stays consistent one level deeper. */
export default function ChapterGrid({ chapters, subjectSlug, icon }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {chapters.map((chapter, i) => {
        const theme = themeForIndex(i);
        const total = chapter.mcq_count || 0;
        const solved = chapter.solved_count || 0;
        const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

        return (
          <Link
            key={chapter.id}
            href={`/qbank/${subjectSlug}/${chapter.id}`}
            className="hm-card relative flex items-center gap-3 overflow-hidden p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-25 ${theme.corner}`} aria-hidden="true" />
            <span
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-xl ${theme.iconBg} ${theme.fg}`}
              aria-hidden="true"
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--color-text)]">{chapter.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {solved}/{total} MCQs
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="flex-none text-[10px] font-semibold text-[var(--color-text-muted)]">{pct}%</span>
              </div>
            </div>
            <ChevronRightIcon className="flex-none text-[var(--color-text-muted)]" aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
