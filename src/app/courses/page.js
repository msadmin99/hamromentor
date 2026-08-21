"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import { api } from "@/lib/api";

function CourseCard({ course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-md shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex h-32 items-center justify-center bg-[var(--color-surface-muted)]">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">🎥</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 font-bold text-[var(--color-text)]">{course.title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">by {course.teacher_name}</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {course.section_count} section{course.section_count === 1 ? "" : "s"} · {course.lesson_count} lesson{course.lesson_count === 1 ? "" : "s"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          {course.is_free ? (
            <span className="rounded-md bg-brand-green-light px-2 py-1 text-xs font-bold text-brand-green">FREE</span>
          ) : (
            <span className="text-lg font-extrabold text-[var(--color-text)]">Rs. {course.price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CoursesContent() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/course-categories/").then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: "approved" });
    if (categoryId) params.set("category", categoryId);
    api
      .get(`/teacher-courses/?${params.toString()}`)
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <AppShell>
      <Header title="Video Lecture Courses" subtitle="Structured courses from expert teachers" />

      <div className="hm-page flex flex-col gap-4">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryId("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                !categoryId ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(String(c.id))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  categoryId === String(c.id) ? "bg-brand-blue text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
        {!loading && courses.length === 0 && (
          <p className="hm-card p-6 text-center text-sm text-[var(--color-text-muted)]">No courses available yet — check back soon.</p>
        )}
      </div>
    </AppShell>
  );
}

export default function CoursesPage() {
  return <CoursesContent />;
}
