"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function MyCoursesContent() {
  const [enrollments, setEnrollments] = useState(null);

  useEffect(() => {
    api.get("/course-enrollments/mine/").then((rows) => {
      const now = Date.now();
      setEnrollments(rows.filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now));
    });
  }, []);

  return (
    <AppShell>
      <Header title="My Courses" subtitle="Video lecture courses you've purchased" />
      <div className="hm-page flex flex-col gap-3">
        {enrollments === null && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
        {enrollments?.map((e) => (
          <Link
            key={e.id}
            href={`/courses/${e.course}`}
            className="hm-card flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="min-w-0">
              <p className="truncate font-bold text-[var(--color-text)]">{e.course_title}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {e.expires_at ? `Access until ${new Date(e.expires_at).toLocaleDateString()}` : "Lifetime access"}
              </p>
            </div>
            <span className="flex-none rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white">Continue →</span>
          </Link>
        ))}
        {enrollments?.length === 0 && (
          <div className="hm-card p-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">You haven&apos;t purchased any courses yet.</p>
            <Link href="/courses" className="mt-3 inline-block rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function MyCoursesPage() {
  return (
    <RequireAuth>
      <MyCoursesContent />
    </RequireAuth>
  );
}
