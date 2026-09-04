"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CheckoutModal from "@/components/CheckoutModal";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import {
  ArchiveIcon, BookOpenIcon, CheckCircleIcon, ClockIcon, DailyTestIcon,
  GrandTestIcon, LockIcon, MockTestIcon, WarningTriangleIcon,
} from "@/components/icons";
import { ErrorCard } from "@/components/subscription/billingShared";
import { TEST_GUIDELINES } from "@/components/testpage/examTypeMeta";
import { accessOf, denialFor, isLocked, sourceLabel } from "@/lib/accessState";
import { api } from "@/lib/api";

// Phase D, Area 5: exam_type -> {label, Icon} for the type badge. A local,
// small map rather than reusing testpage/examTypeMeta's EXAM_TYPE_META —
// that one carries emoji + marketing taglines for the listing hub pages;
// this page needs only the label, paired with the same SVG icons Sidebar/
// MoreMenu/subscription cards already use for these same 5 exam types.
const TYPE_META = {
  qbank: { label: "Question Bank", Icon: BookOpenIcon },
  daily: { label: "Daily Test", Icon: DailyTestIcon },
  mock: { label: "Mock Test", Icon: MockTestIcon },
  grand: { label: "Grand Test", Icon: GrandTestIcon },
  pyq: { label: "Past Year Questions", Icon: ArchiveIcon },
};

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-center">
      <p className="text-2xl font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

function TestDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [error, setError] = useState(false);
  const [prevAttempt, setPrevAttempt] = useState(null); // enrichment only — never blocks the page
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [starting, setStarting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // No synchronous reset before the fetch (state only changes inside
  // .then()/.catch()) — keeps this reusable by both the mount effect and
  // Retry without tripping react-hooks/set-state-in-effect.
  function load() {
    api
      .get(`/tests/${id}/`)
      .then((data) => {
        setTest(data);
        setError(false);
        if (data.has_access && data.requires_password) setNeedsPassword(true);
        // Enriches the "Previous Attempt" card with real accuracy/date —
        // the same already-used /attempts/mine/ endpoint Test History
        // (Area 2) reads, filtered here for the exact attempt
        // access.latest_attempt_id already points "Review"/"View Result"
        // at, so the card and that link always describe the same attempt.
        const latestId = data.access?.latest_attempt_id;
        if (latestId) {
          api
            .get("/attempts/mine/")
            .then((attempts) => {
              const match = attempts.find((a) => a.id === latestId);
              if (match) setPrevAttempt(match);
            })
            .catch(() => {});
        }
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function startTest() {
    setSubmitError("");
    setStarting(true);
    try {
      const attempt = await api.post(`/tests/${id}/start/`, needsPassword ? { access_password: password } : {});
      router.push(`/tests/attempt/${attempt.id}`);
    } catch (err) {
      if (err.status === 402) {
        setSubmitError(err.message);
      } else if (err.status === 403 && /password|exam/i.test(err.message)) {
        setNeedsPassword(true);
        setSubmitError(password ? "Incorrect password." : "This test is password-protected.");
      } else {
        setSubmitError(err.message);
      }
    } finally {
      setStarting(false);
    }
  }

  if (error) {
    return (
      <AppShell>
        <Header title="Test" showBack />
        <div className="hm-page-narrow">
          <ErrorCard title="Unable to load this test." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!test) {
    return (
      <AppShell>
        <Header title="Test" showBack />
        <div className="hm-page mx-auto flex max-w-[1150px] flex-col gap-4">
          <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="h-3 w-24 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-3 h-6 w-2/3 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-3 w-1/3 rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
            ))}
          </div>
          <div className="h-32 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
        </div>
      </AppShell>
    );
  }

  // Phase 10 — state comes from the server's access decision, not from
  // price or a locally recomputed attempt count. `previewOnly` is now the
  // backend's own is_preview_only() rather than a fourth re-derivation.
  const access = accessOf(test);
  const attemptsUsed = test.attempts_used ?? 0;
  const attemptsLeft = access.attempts_left ?? Math.max(0, test.max_attempts - attemptsUsed);
  const exhausted = attemptsLeft <= 0;
  const previewOnly = Boolean(test.preview_only);
  const locked = isLocked(test);
  const denial = denialFor(test);
  const entitledVia = sourceLabel(test);
  const typeMeta = TYPE_META[test.exam_type];
  const courseNames = (test.courses_detail || []).map((c) => c.name).join(", ");
  // The real bug this replaces: the old button only ever read the local
  // `locked`/`exhausted` booleans, so an upcoming/closed/attempts-exhausted
  // test (access.can_start === false, but isLocked() === false since that
  // only checks state==='locked') still showed an enabled "Start test"
  // button that the server would then 403. can_start/can_continue are the
  // one true gate for whether this button may appear at all.
  const canAct = access.can_start || access.can_continue;

  return (
    <AppShell>
      <Header title={test.title} showBack />
      <div className="hm-page mx-auto flex max-w-[1150px] flex-col gap-4">
        {/* 1. Test Hero */}
        <div className="hm-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {typeMeta && (
              <span className="flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold text-brand-blue">
                <typeMeta.Icon className="h-3.5 w-3.5" /> {typeMeta.label.toUpperCase()}
              </span>
            )}
            {test.is_pro && (
              <span className="rounded-md bg-brand-green-light px-2 py-1 text-[10px] font-bold text-brand-green">PRO</span>
            )}
            {test.is_new && (
              <span className="rounded-md bg-warning-soft px-2 py-1 text-[10px] font-bold text-amber-800">NEW</span>
            )}
          </div>
          <h1 className="mt-2 text-lg font-extrabold leading-snug text-[var(--color-text)] sm:text-xl">{test.title}</h1>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {[courseNames, test.subject_name].filter(Boolean).join(" · ")}
          </p>
          {test.description && <p className="mt-3 text-sm text-[var(--color-text)]">{test.description}</p>}
        </div>

        {/* 2. Key statistics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={test.question_count} label="Questions" />
          <StatCard value={`${test.duration_minutes} min`} label="Duration" />
          <StatCard value={test.total_marks} label="Total Marks" />
          <StatCard value={test.max_attempts} label="Max Attempts" />
        </div>

        {/* 4. Marking scheme — only the boolean the API actually returns.
            No per-question point value is available on this endpoint (marks/
            negative_marks live on individual questions, only loaded once an
            attempt starts), so this section never invents a number like
            "+1 / -0.25". */}
        <div className="hm-card p-4">
          <p className="text-sm font-bold text-[var(--color-text)]">Marking Scheme</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-brand-green-light px-3 py-2.5">
              <CheckCircleIcon className="h-4 w-4 flex-none text-brand-green" />
              <div>
                <p className="text-xs font-semibold text-brand-green">Correct Answer</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Marks awarded per question</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
                test.negative_marking ? "bg-brand-red-light" : "bg-[var(--color-surface-muted)]"
              }`}
            >
              <WarningTriangleIcon className={`h-4 w-4 flex-none ${test.negative_marking ? "text-brand-red" : "text-[var(--color-text-muted)]"}`} />
              <div>
                <p className={`text-xs font-semibold ${test.negative_marking ? "text-brand-red" : "text-[var(--color-text)]"}`}>
                  {test.negative_marking ? "Negative Marking" : "No Negative Marking"}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {test.negative_marking ? "Marks deducted for wrong answers" : "No marks deducted for wrong answers"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Previous attempt — only the enriched real data; the plain
            attempts-remaining fact is shown separately below regardless of
            whether the enrichment fetch succeeded. */}
        <div className="hm-card p-4">
          <p className="text-sm font-bold text-[var(--color-text)]">Previous Attempt</p>
          {prevAttempt ? (
            <>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold leading-none text-[var(--color-text)]">
                    {prevAttempt.score}
                    <span className="text-sm font-semibold text-[var(--color-text-muted)]"> / {prevAttempt.total_marks}</span>
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Score</p>
                </div>
                {prevAttempt.accuracy != null && (
                  <div className="text-right">
                    <p className="text-2xl font-extrabold leading-none text-brand-blue">{prevAttempt.accuracy}%</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Accuracy</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{formatDate(prevAttempt.start_time)}</p>
              <Link
                href={`/tests/result/${prevAttempt.id}`}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand-blue text-sm font-bold text-brand-blue"
              >
                View Analysis →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">You haven&apos;t attempted this test yet.</p>
          )}
        </div>

        {/* Attempts remaining */}
        <div className={`hm-card flex items-center justify-between p-4 ${exhausted ? "border-brand-red" : ""}`}>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Attempts</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {attemptsUsed} of {test.max_attempts} used
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${
              exhausted ? "bg-brand-red-light text-brand-red" : "bg-brand-green-light text-brand-green"
            }`}
          >
            {exhausted ? "No attempts left" : `${attemptsLeft} left`}
          </span>
        </div>

        {access.state === "review" && access.latest_attempt_id && (
          <Link
            href={`/tests/result/${access.latest_attempt_id}`}
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-brand-blue px-6 text-center text-sm font-bold text-brand-blue"
          >
            Review Test →
          </Link>
        )}

        {/* 5. Access / eligibility */}
        {locked && test.exam_type === "grand" && (
          <div className="hm-card border-brand-blue p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
              <LockIcon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">This is a paid Grand Test.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Buy it once — you&apos;ll get a unique password by email once your payment is approved.
            </p>
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="mt-3 min-h-[44px] rounded-xl bg-brand-blue px-6 text-sm font-bold text-white"
            >
              Buy for Rs. {test.price}
            </button>
          </div>
        )}

        {entitledVia && (
          <p className="flex items-center gap-1.5 rounded-lg bg-brand-green-light px-3 py-2 text-xs font-semibold text-brand-green">
            <CheckCircleIcon className="h-3.5 w-3.5 flex-none" /> {entitledVia}
          </p>
        )}

        {/* Phase 10: the specific reason, from the backend's reason_code —
            "you've used your free test" reads differently from "this needs a
            subscription" and from "the window has closed", and an upgrade
            link only appears where the server says one would actually help. */}
        {denial && test.exam_type !== "grand" && !previewOnly && (
          <div className="hm-card border-[var(--color-border)] p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
              {locked ? <LockIcon className="h-5 w-5" /> : <ClockIcon className="h-5 w-5" />}
            </span>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{denial.title}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{denial.body}</p>
            {/* Real scheduled dates, when the server actually returned
                them — never a fabricated "opens soon" without a date. */}
            {access.state === "upcoming" && test.scheduled_start && (
              <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">Opens {formatDateTime(test.scheduled_start)}</p>
            )}
            {access.state === "closed" && test.scheduled_end && (
              <p className="mt-1 text-xs font-semibold text-[var(--color-text)]">Closed {formatDateTime(test.scheduled_end)}</p>
            )}
            {denial.upgradeAvailable && denial.action && denial.href && (
              <Link href={denial.href} className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-brand-blue px-6 text-sm font-bold text-white">
                {denial.action}
              </Link>
            )}
          </div>
        )}

        {previewOnly && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-amber-800">
            Preview mode — you can view the first {test.free_preview_questions} question(s) but need to{" "}
            <Link href="/plans" className="font-bold underline">
              subscribe
            </Link>{" "}
            to submit.
          </p>
        )}

        {canAct && needsPassword && !exhausted && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              {test.exam_type === "grand" ? "Your unique exam password" : "Test password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hm-input"
              placeholder="Enter password"
            />
          </div>
        )}

        {submitError && <p className="rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">{submitError}</p>}

        {/* 7. Instructions — real, platform-wide exam rules (not fabricated
            per-test copy; this Test model has no dedicated instructions
            field, so nothing test-specific is invented here). */}
        <div className="hm-card p-4">
          <button
            type="button"
            onClick={() => setGuidelinesOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
            aria-expanded={guidelinesOpen}
          >
            <span className="text-sm font-bold text-[var(--color-text)]">Exam Guidelines</span>
            <span className="text-xs font-bold text-brand-blue">{guidelinesOpen ? "Hide" : "Show"}</span>
          </button>
          {guidelinesOpen && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {TEST_GUIDELINES.map((g) => (
                <li key={g} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                  <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-brand-blue" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 8. Primary CTA — only when the server actually allows starting
            or continuing. Never shown for upcoming/closed/attempts_exhausted/
            locked states, matching "never display Start Test when can_start
            is false" exactly (the previous version only checked isLocked(),
            which does not cover those other three denied states). */}
        {canAct && (
          <>
            {!needsPassword && (
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                {access.state === "continue"
                  ? "You're mid-way — finish strong."
                  : previewOnly
                    ? "Preview the first questions before you subscribe."
                    : "Ready to test your preparation?"}
              </p>
            )}
            <button
              type="button"
              onClick={startTest}
              disabled={starting || exhausted}
              className="min-h-[44px] rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {exhausted
                ? "No attempts left"
                : starting
                  ? "Starting…"
                  : previewOnly
                    ? "Preview Test →"
                    : access.state === "continue"
                      ? "Continue Test →"
                      : "Start Test →"}
            </button>
          </>
        )}

        {showCheckout && (
          <CheckoutModal
            kind="grand_test"
            grandTest={test}
            onClose={() => setShowCheckout(false)}
            onSubmitted={load}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function TestDetailPage() {
  return (
    <RequireAuth>
      <TestDetailContent />
    </RequireAuth>
  );
}
