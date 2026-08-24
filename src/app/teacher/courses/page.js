"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import RequireTeacher from "@/components/RequireTeacher";
import { api } from "@/lib/api";

const STATUS_STYLES = {
  approved: "bg-brand-green-light text-brand-green",
  rejected: "bg-brand-red-light text-brand-red",
  pending_review: "bg-yellow-100 text-yellow-700",
  draft: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  archived: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

function CoursesContent() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    api.get("/teacher-courses/?mine=1").then(setCourses);
  }, []);

  return (
    <div className="hm-page flex flex-col gap-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">My Courses</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Create and manage your courses.</p>
        </div>
        <Link href="/teacher/courses/new" className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white">
          + Create Course
        </Link>
      </div>

      {courses === null && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(courses || []).map((c) => (
          <Link key={c.id} href={`/teacher/courses/${c.id}/edit`} className="hm-card flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">{c.title}</p>
              <span className={`flex-none rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[c.status] || ""}`}>
                {c.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {c.section_count} section{c.section_count === 1 ? "" : "s"} · {c.lesson_count} lesson{c.lesson_count === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{c.is_free ? "Free" : `Rs. ${c.price}`}</p>
            {c.status === "rejected" && c.rejection_reason && (
              <p className="text-xs text-brand-red">Reason: {c.rejection_reason}</p>
            )}
          </Link>
        ))}
      </div>

      {courses !== null && courses.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">You haven&apos;t created any courses yet.</p>
      )}
    </div>
  );
}

export default function TeacherCoursesPage() {
  return (
    <RequireTeacher>
      <AppShell>
        <CoursesContent />
      </AppShell>
    </RequireTeacher>
  );
}
