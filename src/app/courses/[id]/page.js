"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CheckoutModal from "@/components/CheckoutModal";
import Header from "@/components/Header";
import { LockIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const LESSON_ICONS = { video: "🎥", pdf: "📄", quiz: "📝", live_class: "📡", notes: "📓" };

function lessonHref(lesson) {
  if (lesson.lesson_type === "video" && lesson.video) return `/videos/${lesson.video}`;
  if (lesson.lesson_type === "quiz" && lesson.test) return `/tests/${lesson.test}`;
  if (lesson.lesson_type === "pdf" && lesson.pdf_file) return lesson.pdf_file;
  return null;
}

function CourseDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api
      .get(`/teacher-courses/${id}/`)
      .then(setCourse)
      .catch((e) => setError(e.message));
    if (user) {
      api
        .get("/course-enrollments/mine/")
        .then((rows) => setEnrolled(rows.some((r) => r.course === Number(id))))
        .catch(() => {});
    }
  }

  useEffect(load, [id, user]);

  if (error) {
    return (
      <AppShell>
        <Header title="Course" showBack />
        <p className="hm-page-narrow text-sm text-brand-red">{error}</p>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <Header title="Course" showBack />
        <p className="hm-page-narrow text-sm text-[var(--color-text-muted)]">Loading…</p>
      </AppShell>
    );
  }

  function handleBuy() {
    if (!user) {
      router.push("/login");
      return;
    }
    setShowCheckout(true);
  }

  return (
    <AppShell>
      <Header title={course.title} showBack />
      <div className="hm-page flex flex-col gap-4">
        <div className="hm-card overflow-hidden p-0">
          {course.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail} alt={course.title} className="h-48 w-full object-cover" />
          )}
          <div className="p-5">
            <p className="text-xl font-extrabold text-[var(--color-text)]">{course.title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">by {course.teacher_name}</p>
            {course.short_description && <p className="mt-3 text-sm text-[var(--color-text)]">{course.short_description}</p>}
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              {course.section_count} section{course.section_count === 1 ? "" : "s"} · {course.lesson_count} lesson{course.lesson_count === 1 ? "" : "s"}
              {course.level && ` · ${course.level}`}
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-surface-muted)] p-3">
              {course.is_free ? (
                <span className="text-lg font-extrabold text-brand-green">Free</span>
              ) : (
                <span className="text-2xl font-extrabold text-[var(--color-text)]">Rs. {course.price}</span>
              )}
              {enrolled ? (
                <span className="rounded-lg bg-brand-green-light px-4 py-2 text-sm font-bold text-brand-green">✓ Purchased</span>
              ) : (
                <button onClick={handleBuy} className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white">
                  {course.is_free ? "Enroll Free" : "Buy Course"}
                </button>
              )}
            </div>
          </div>
        </div>

        {course.description && (
          <div className="hm-card p-5">
            <p className="mb-2 text-sm font-bold text-[var(--color-text)]">About this course</p>
            <p className="whitespace-pre-line text-sm text-[var(--color-text-muted)]">{course.description}</p>
          </div>
        )}

        <div className="hm-card p-5">
          <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Curriculum</p>
          <div className="flex flex-col gap-3">
            {course.sections.map((section) => (
              <div key={section.id}>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{section.title}</p>
                <div className="flex flex-col gap-1">
                  {section.lessons.map((lesson) => {
                    const href = enrolled ? lessonHref(lesson) : null;
                    const Wrapper = href ? "a" : "div";
                    return (
                      <Wrapper
                        key={lesson.id}
                        {...(href ? { href } : {})}
                        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]"
                      >
                        <span>{LESSON_ICONS[lesson.lesson_type] || "📘"}</span>
                        <span className="flex-1">{lesson.title}</span>
                        {!enrolled && <LockIcon className="h-3.5 w-3.5 flex-none text-[var(--color-text-muted)]" />}
                      </Wrapper>
                    );
                  })}
                </div>
              </div>
            ))}
            {course.sections.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">Curriculum coming soon.</p>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          kind="teacher_course"
          teacherCourse={course}
          onClose={() => setShowCheckout(false)}
          onSubmitted={load}
        />
      )}
    </AppShell>
  );
}

export default function CourseDetailPage() {
  return <CourseDetailContent />;
}
