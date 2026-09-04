"use client";

import { useState } from "react";
import { BookOpenIcon, ChevronDownIcon } from "./icons";
import { useCourse } from "@/lib/course-context";

// variant="solid": same component, same state/switching logic, same
// dropdown/menu markup below — only the trigger button's surface changes,
// to a solid white pill with a leading book icon (Exams hub hero). Every
// other caller passes no variant and renders byte-for-byte as before.
export default function CourseSwitcher({ variant = "translucent" }) {
  const { activeCourse, otherCourses, switchCourse, switching } = useCourse();
  const [open, setOpen] = useState(false);
  const solid = variant === "solid";

  if (!activeCourse && otherCourses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className={
          solid
            ? "flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-text)] shadow-sm transition hover:bg-white/90 disabled:opacity-60"
            : "flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-60"
        }
      >
        {solid && <BookOpenIcon className="flex-none text-[var(--color-marketing-bar)]" aria-hidden="true" />}
        <span className={solid ? "flex-none text-[var(--color-text-muted)]" : "flex-none text-white/70"}>Course:</span>
        <span className="min-w-0 truncate">{switching ? "Switching…" : activeCourse?.name || "Select course"}</span>
        <ChevronDownIcon className={`flex-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-2xl">
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
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <span className="min-w-0 truncate">{e.course_name}</span>
                    <span className="flex-none text-xs text-[var(--color-text-muted)]">{e.course_program_group}</span>
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
