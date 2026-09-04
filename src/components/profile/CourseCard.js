"use client";

import { BookOpenIcon } from "../icons";
import CourseSwitcher from "../CourseSwitcher";

/**
 * Profile redesign (Phase B) — the real `<CourseSwitcher variant="solid" />`
 * embedded directly (same component every other page uses, same
 * useCourse()/switchCourse() call underneath — see CourseSwitcher.js).
 * Nothing about course switching is reimplemented here; when there is only
 * one enrollment, CourseSwitcher's own dropdown already says so.
 */
export default function CourseCard({ activeCourse }) {
  return (
    <section className="hm-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <BookOpenIcon />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Current Course</p>
      </div>
      <p className="mt-3 text-lg font-extrabold text-[var(--color-text)]">{activeCourse?.name || "No course selected"}</p>
      <p className="text-xs text-[var(--color-text-muted)]">Your active preparation course</p>
      <div className="mt-3">
        <CourseSwitcher variant="solid" />
      </div>
    </section>
  );
}
