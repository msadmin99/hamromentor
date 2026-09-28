"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import PublicMcqQuiz from "@/components/PublicMcqQuiz";
import { api } from "@/lib/api";

// Product spec §22: the visitor is explicitly asked to choose a program
// here — this picker never pre-selects one (not even the CEE-UG/MBBS
// default the register page uses for first-time signups). That default
// exists to help a first-time registrant who hasn't thought about it yet;
// it must never override a program a visitor is actively, deliberately
// choosing on this page.
function ProgramPicker({ courses, onChoose }) {
  const groups = [];
  const seen = new Set();
  for (const c of courses) {
    const key = c.program_group || "Other";
    if (!seen.has(key)) { seen.add(key); groups.push(key); }
  }
  return (
    <div className="hm-page-narrow flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-extrabold text-[var(--color-text)]">MCQ of the Day</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Free, no sign-up needed. Choose your program to get today&apos;s 5 MCQs — a fresh set every day, only from
          that program&apos;s own subjects, with answers and explanations included.
        </p>
      </div>
      {groups.map((group) => (
        <section key={group}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{group}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {courses.filter((c) => (c.program_group || "Other") === group).map((c) => (
              <button key={c.id} onClick={() => onChoose(c.prefix)}
                className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left text-sm font-bold text-[var(--color-text)] transition hover:border-brand-blue hover:text-brand-blue">
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
  useEffect(() => { api.get("/courses/").then(setCourses).catch(() => {}); }, []);
  const [dailySet, setDailySet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coursePrefix) { setDailySet(null); return; }
    setLoading(true); setError("");
    // Public endpoint — no auth token is sent or required (spec §8/§17: an
    // already-logged-in visitor gets the exact same public flow, not a
    // different authenticated one).
    api.get(`/mcq-of-the-day-set/?course=${encodeURIComponent(coursePrefix)}`)
      .then(setDailySet)
      .catch((err) => setError(err.message || "Couldn't load today's MCQs."))
      .finally(() => setLoading(false));
  }, [coursePrefix]);

  function choose(prefix) { router.push(`/mcq-of-the-day?course=${encodeURIComponent(prefix)}`); }
  function changeProgram() { router.push("/mcq-of-the-day"); }

  if (!coursePrefix) {
    return (
      <AppShell><Header title="MCQ of the Day" showBack /><ProgramPicker courses={courses} onChoose={choose} /></AppShell>
    );
  }

  return (
    <AppShell>
      <Header title={dailySet?.course?.name ? `Today's 5 MCQs — ${dailySet.course.name}` : "MCQ of the Day"} showBack />
      <div className="hm-page-narrow flex min-h-0 flex-1 flex-col gap-4">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading today&apos;s 5 MCQs…</p>}
        {error && <div className="rounded-xl bg-brand-red-light px-4 py-3 text-sm font-medium text-brand-red">{error}</div>}
        {dailySet && dailySet.questions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">No MCQ of the Day is available for this program yet — check back soon.</p>
        )}
        {dailySet && dailySet.questions.length > 0 && (
          <PublicMcqQuiz
            questions={dailySet.questions}
            coursePrefix={coursePrefix}
            onFinish={changeProgram}
            finishLabel="Change Program"
          />
        )}
        {!loading && !(dailySet && dailySet.questions.length > 0) && (
          <button onClick={changeProgram} className="self-start text-xs font-bold text-brand-blue">
            ← Change Program
          </button>
        )}
      </div>
    </AppShell>
  );
}

// Deliberately NOT wrapped in RequireAuth (spec §1/§2/§8): "A visitor must
// NOT register or log in to use it." Both anonymous and already-logged-in
// visitors render this exact same component and get the exact same public
// flow (spec §17) — there is no authenticated variant of this page.
export default function McqOfTheDayPage() {
  return (<Suspense fallback={null}><McqOfTheDayContent /></Suspense>);
}
