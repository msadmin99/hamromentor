"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Teacher-authored video courses (marketplace.TeacherCourse) — a COURSE
 * purchase, structurally unrelated to SubscriptionPlan/Subscription (its
 * own Purchase(kind='teacher_course') + CourseEnrollment path). Deliberately
 * styled closer to a learning-product card (thumbnail, teacher, curriculum
 * size) than a pricing card, per the brief. Buy action delegated to the
 * existing /courses/[id] page, which already has the CheckoutModal wired. */
export default function CourseSection({ enrolledCourseIds }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/teacher-courses/?status=approved").then((data) => setCourses(data.slice(0, 3)));
  }, []);

  if (courses.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-extrabold text-[var(--color-text)]">Video Lecture Courses</h3>
        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-700">
          COURSES
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Learn from structured, exam-focused video courses.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {courses.map((c) => {
          const enrolled = (enrolledCourseIds || []).has(c.id);
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative flex h-32 items-center justify-center bg-[var(--color-surface-muted)]">
                {c.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl" aria-hidden="true">🎥</span>
                )}
                {enrolled && (
                  <span className="absolute right-2 top-2 rounded-md bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">
                    ENROLLED
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="line-clamp-2 font-bold text-[var(--color-text)]">{c.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">By {c.teacher_name}</p>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  {c.lesson_count} Lecture{c.lesson_count === 1 ? "" : "s"} · Notes Available · MCQs Available
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  {c.is_free ? (
                    <span className="rounded-md bg-brand-green-light px-2 py-1 text-xs font-bold text-brand-green">FREE</span>
                  ) : (
                    <span className="text-lg font-extrabold text-[var(--color-text)]">Rs. {c.price}</span>
                  )}
                  <span className="text-xs font-bold text-brand-blue">{enrolled ? "Continue →" : "View Course →"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="/courses" className="mt-3 inline-block text-xs font-bold text-brand-blue">
        Browse all courses →
      </Link>
    </section>
  );
}
