"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Avatar circle next to the greeting — shows the student's own profile
 * photo (same `user.profile.photo` field and upload flow as
 * ProfileHero.js on /profile — nothing new to fetch, nothing new to
 * upload), or an "Add Image" prompt when they haven't set one. Links to
 * /profile (where the real photo picker lives, camera button and all)
 * rather than /settings: /settings is for editing text fields, the
 * photo picker has always lived on /profile. Gives a student this
 * upload entry point right where they land every day, not only after
 * finding their way to Profile first. */
function AvatarCircle({ photoUrl }) {
  return (
    <Link
      href="/profile"
      aria-label={photoUrl ? "Open your profile photo" : "Add a profile photo"}
      className="flex h-[88px] w-[88px] flex-none items-center justify-center overflow-hidden rounded-full bg-brand-blue text-center text-xs font-bold text-white"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>
          Add
          <br />
          Image
        </span>
      )}
    </Link>
  );
}

function StatChip({ icon, value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 py-2 text-center">
      <p className="text-base font-extrabold leading-none text-[var(--color-text)]">
        <span aria-hidden="true">{icon}</span> {value}
      </p>
      <p className="text-[10px] font-semibold leading-tight text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

/** QBank 2.0 (§4): greeting + a real, non-fabricated status row — Day
 * Streak / Questions Today / Overall Accuracy — matching Qbank12.png's
 * "3 Day Streak · 20 Qs today · 62% Overall accuracy" reference.
 *
 * Reuses two calls the page already needed rather than adding a new
 * endpoint or duplicating a fetch:
 *  - /performance/overview/ (already fetched here for the streak badge)
 *    also already returns questions_today (tests_app/performance.py:
 *    kpi_overview) — platform-wide (QBank + every test type), exactly
 *    matching the Home page's own Daily Goal semantics, so QBank's
 *    "today" count is never a second, disagreeing definition.
 *  - `accuracy`/`attempted` are passed in as props from the parent
 *    (qbank/page.js), which already fetches them from
 *    /questions/dashboard/ for SmartPracticeGrid/ProgressSummary.
 *    Deliberately NOT /performance/overview/'s own overall_accuracy,
 *    which is Test-mode only (TestAttempt-derived) and would silently
 *    misrepresent QBank practice accuracy on a QBank-specific page.
 *
 * QBank 2.0 (§11): never show a fabricated 0% — accuracy only renders
 * as a real percentage once `attempted > 0`; otherwise "—", matching
 * "show Not attempted yet, not 0% Accuracy." */
export default function QBankHero({ accuracy, attempted }) {
  const { user } = useAuth();
  const { activeCourse } = useCourse();
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/performance/overview/?${params.toString()}`)
      .then((data) => setKpis(data?.kpis || null))
      .catch(() => setKpis(null));
  }, [activeCourse?.id]);

  const greeting = greetingForHour(new Date().getHours());
  const name = user?.first_name || "Student";
  const photoUrl = user?.profile?.photo || null;
  const streak = kpis?.current_streak_days ?? 0;
  const questionsToday = kpis?.questions_today ?? 0;
  const hasAccuracy = (attempted ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {greeting}, {name}! <span aria-hidden="true">👋</span>
          </p>
          {/* QBank 2.0 visual QA (Qbank12.png): this headline is the single
              largest, boldest text on the reference's home screen — bigger
              than the "Revise Digestive System" NBA title below it. text-lg
              read visually flat against that hierarchy; bumped one step up. */}
          <h1 className="mt-0.5 text-xl font-extrabold leading-tight text-[var(--color-text)] sm:text-2xl">
            Let&apos;s make progress today.
          </h1>
        </div>
        <AvatarCircle photoUrl={photoUrl} />
      </div>

      {/* Mobile scroll-blanking fix: this stat row previously rendered
          NOTHING at all until /performance/overview/ resolved ({kpis &&
          (...)}, no skeleton) — the same class of bug already fixed
          elsewhere on this exact page (ProgressSummary, NextPracticeCard,
          RecommendedForYou, SubjectGrid — see their own comments), just
          never applied here since this component didn't exist yet when
          those fixes shipped. Sitting at the very top of the page, its
          height jump on load pushed every card below it down at once —
          exactly the reported real-device symptom. Same fix: reserve the
          identical hm-card/divide-x shape whether or not `kpis` has
          arrived yet, so there is never a transition to cause a shift.
          A fetch failure leaves `kpis` null forever, same as every other
          fixed component here — staying on the skeleton shape rather than
          collapsing to nothing, which is the safer failure mode. */}
      {kpis ? (
        <div className="hm-card flex items-stretch divide-x divide-[var(--color-border)]">
          {/* Icon-per-stat swapped to match Qbank12.png exactly: 🎯 for
              Qs Today, 📈 for Overall Accuracy (was 📝/🎯 — visually close
              but not the reference's own pairing). */}
          <StatChip icon="🔥" value={streak} label={`Day Streak${streak === 1 ? "" : "s"}`} />
          <StatChip icon="🎯" value={questionsToday} label="Qs Today" />
          <StatChip icon="📈" value={hasAccuracy ? `${accuracy}%` : "—"} label="Overall Accuracy" />
        </div>
      ) : (
        <div className="hm-card flex animate-pulse items-stretch divide-x divide-[var(--color-border)]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5 py-2">
              <div className="h-4 w-10 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-2.5 w-14 rounded bg-[var(--color-surface-muted)]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
