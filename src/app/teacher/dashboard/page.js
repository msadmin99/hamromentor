"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import RequireTeacher from "@/components/RequireTeacher";
import { api } from "@/lib/api";

function DashboardContent() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    api.get("/teacher-courses/?mine=1").then(setCourses);
  }, []);

  const counts = (courses || []).reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="hm-page flex flex-col gap-5 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Overview of your courses.</p>
        </div>
        <Link href="/teacher/courses/new" className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white">
          + Create Course
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="hm-card p-4">
          <p className="text-2xl font-extrabold text-[var(--color-text)]">{courses?.length ?? "—"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Total Courses</p>
        </div>
        <div className="hm-card p-4">
          <p className="text-2xl font-extrabold text-[var(--color-text-muted)]">{counts.draft || 0}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Draft</p>
        </div>
        <div className="hm-card p-4">
          <p className="text-2xl font-extrabold text-yellow-600">{counts.pending_review || 0}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Pending Review</p>
        </div>
        <div className="hm-card p-4">
          <p className="text-2xl font-extrabold text-brand-green">{counts.approved || 0}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Approved</p>
        </div>
        <div className="hm-card p-4">
          <p className="text-2xl font-extrabold text-brand-red">{counts.rejected || 0}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Rejected</p>
        </div>
      </div>

      <Link href="/teacher/courses" className="text-sm font-semibold text-brand-blue">
        View all my courses →
      </Link>
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <RequireTeacher>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </RequireTeacher>
  );
}
