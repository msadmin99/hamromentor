"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { useCourse } from "@/lib/course-context";

function ChooseCourseContent() {
  const { enrollments, activeCourse, switchCourse, loading } = useCourse();
  const router = useRouter();
  const [startingId, setStartingId] = useState(null);

  async function startNow(courseId) {
    setStartingId(courseId);
    try {
      await switchCourse(courseId);
      router.push("/home");
    } finally {
      setStartingId(null);
    }
  }

  return (
    <AppShell>
      <Header title="Choose Your Course" subtitle="Pick a course to open its dashboard" showBack />

      <div className="hm-page-narrow flex flex-col gap-3 py-6">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading your courses…</p>}
        {!loading && enrollments.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">You&apos;re not enrolled in any course yet.</p>
        )}

        {enrollments.map((e) => (
          <div key={e.id} className="hm-card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-text)]">{e.course_name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{e.course_program_group}</p>
              {activeCourse?.id === e.course && (
                <span className="mt-1 inline-block rounded-md bg-brand-green-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
                  Currently active
                </span>
              )}
            </div>
            <button
              onClick={() => startNow(e.course)}
              disabled={startingId === e.course}
              className="flex-none rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {startingId === e.course ? "Starting…" : "Start Now"}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default function ChooseCoursePage() {
  return (
    <RequireAuth>
      <ChooseCourseContent />
    </RequireAuth>
  );
}
