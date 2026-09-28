"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

/** "MCQ of the Day" tab — choose a program, then 5 auto-rotating MCQs for
 * that program only (never another program's questions — see the backend's
 * DailyMCQSetView/question_scoped_to_single_course for the actual scoping).
 * Deliberately always asks which program, even for a logged-in student
 * with an active course already set — a student may want to try a
 * different program's daily set on purpose, and the choice is cheap
 * (one tap) compared to silently guessing wrong. */
function ProgramPicker({ courses, onChoose }) {
  const groups = [];
  const seen = new Set();
  for (const c of courses) {
    const key = c.program_group || "Other";
    if (!seen.has(key)) {
      seen.add(key);
      groups.push(key);
    }
  }

  return (
    <div className="hm-page-narrow flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-[var(--color-text)]">MCQ of the Day</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Choose your program to get today&apos;s 5 MCQs — a fresh set every day, only from that program&apos;s own subjects.
        </p>
      </div>
      {groups.map((group) => (
        <section key={group}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{group}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {courses
              .filter((c) => (c.program_group || "Other") === group)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => onChoose(c.prefix)}
                  className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left text-sm font-bold text-[var(--color-text)] transition hover:border-brand-blue hover:text-brand-blue"
                >
                  {c.name}
                </button>
              ))}
          </div>
        </section>
      ))}
      {courses.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Loading programs…</p>}
    </div>
  );
}

function McqOfTheDayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coursePrefix = searchParams.get("course") || "";

  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api.get("/courses/").then(setCourses).catch(() => {});
  }, []);

  const [dailySet, setDailySet] = useState(null); // { course, date, questions }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coursePrefix) {
      setDailySet(null);
      return;
    }
    setLoading(true);
    setError("");
    api
      .get(`/mcq-of-the-day-set/?course=${encodeURIComponent(coursePrefix)}`)
      .then(setDailySet)
      .catch((err) => setError(err.message || "Couldn't load today's MCQs."))
      .finally(() => setLoading(false));
  }, [coursePrefix]);

  function choose(prefix) {
    router.push(`/mcq-of-the-day?course=${encodeURIComponent(prefix)}`);
  }

  if (!coursePrefix) {
    return (
      <AppShell>
        <Header title="MCQ of the Day" showBack />
        <ProgramPicker courses={courses} onChoose={choose} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title={dailySet?.course?.name ? `${dailySet.course.name} — MCQ of the Day` : "MCQ of the Day"} showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading today&apos;s 5 MCQs…</p>}
        {error && (
          <div className="rounded-xl bg-brand-red-light px-4 py-3 text-sm font-medium text-brand-red">{error}</div>
        )}
        {dailySet && dailySet.questions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">
            No MCQ of the Day is available for this program yet — check back soon.
          </p>
        )}
        {dailySet && dailySet.questions.length > 0 && (
          <QuestionSolver
            questions={dailySet.questions}
            finishLabel="Done for today"
            onFinish={() => router.push("/home")}
          />
        )}
        {!loading && (
          <button
            onClick={() => router.push("/mcq-of-the-day")}
            className="self-start text-xs font-bold text-brand-blue"
          >
            ← Choose a different program
          </button>
        )}
      </div>
    </AppShell>
  );
}

export default function McqOfTheDayPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <McqOfTheDayContent />
      </Suspense>
    </RequireAuth>
  );
}
