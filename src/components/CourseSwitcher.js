"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./icons";
import { useCourse } from "@/lib/course-context";

export default function CourseSwitcher() {
  const { activeCourse, otherCourses, switchCourse, switching } = useCourse();
  const [open, setOpen] = useState(false);

  if (!activeCourse && otherCourses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
      >
        <span className="text-white/70">Course:</span>
        {switching ? "Switching…" : activeCourse?.name || "Select course"}
        <ChevronDownIcon className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--color-border)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                Current course
              </p>
              <p className="text-sm font-bold text-[var(--color-text)]">{activeCourse?.name || "—"}</p>
            </div>
            {otherCourses.length > 0 ? (
              <div className="py-1">
                <p className="px-3 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Switch to
                </p>
                {otherCourses.map((e) => (
                  <button
                    key={e.id}
                    onClick={async () => {
                      setOpen(false);
                      await switchCourse(e.course);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  >
                    {e.course_name}
                    <span className="text-xs text-[var(--color-text-muted)]">{e.course_program_group}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">
                You&apos;re only enrolled in one course.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
