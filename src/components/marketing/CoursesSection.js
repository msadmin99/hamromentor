"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

const FALLBACK_CARD = { icon: "🎓", color: "#224c5a", description: "" };

export default function CoursesSection({ s, courses }) {
  const { user } = useAuth();
  const { enrollments, switchCourse } = useCourse();
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

  // Logged-in students see only the courses they're enrolled in — this section
  // is their personal "choose your course" picker, not the public catalog.
  const cards = user
    ? enrollments.map((e) => {
        const match = courses.find((c) => c.id === e.course);
        return match || { id: e.course, label: e.course_name, tag: e.course_program_group, ...FALLBACK_CARD };
      })
    : courses;

  return (
    <section id="courses" className="hm-navy-section px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <span className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white/70">
          {s.courses_eyebrow}
        </span>
        <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">{s.courses_heading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">{s.courses_subtitle}</p>

        <div className="mt-12 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl bg-white">
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${c.color}22` }}
                  >
                    {c.icon}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    →
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-text)]">{c.label}</h3>
                {c.tag && <p className="text-xs font-semibold text-[var(--color-text-muted)]">{c.tag}</p>}
                {c.description && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{c.description}</p>}
                {user ? (
                  <button
                    onClick={() => startNow(c.id)}
                    disabled={startingId === c.id}
                    className="mt-4 text-sm font-bold text-[var(--color-marketing-accent)] disabled:opacity-60"
                  >
                    {startingId === c.id ? "Starting…" : "Start now →"}
                  </button>
                ) : (
                  <Link href={c.link_url || "/register"} className="mt-4 inline-block text-sm font-bold text-[var(--color-marketing-accent)]">
                    Start now →
                  </Link>
                )}
              </div>
            </div>
          ))}
          {user && cards.length === 0 && (
            <p className="col-span-full text-sm text-white/60">You&apos;re not enrolled in any course yet.</p>
          )}

          <Link href="/qbank" className="overflow-hidden rounded-2xl bg-white">
            <div className="h-1.5" style={{ background: "#ed220d" }} />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: "#ed220d22" }}>
                  📚
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  →
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--color-text)]">Explore all subjects</h3>
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">QBank</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Browse the full question bank across every subject, no course pick required.
              </p>
              <span className="mt-4 inline-block text-sm font-bold text-[var(--color-marketing-accent)]">Start now →</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
