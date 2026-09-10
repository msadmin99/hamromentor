"use client";

import Link from "next/link";
import { CalendarIcon, CheckCircleIcon, ClockIcon, WarningTriangleIcon } from "@/components/icons";

/**
 * Grand Test 3.0 — Release Candidate integration.
 *
 * Renders the state-specific panel for a scheduled Grand Test on the exam
 * detail page. It reads the backend's OWN derived state
 * (`test.grand_test_status`, one of not_scheduled | upcoming | live |
 * in_progress | completed | missed — see
 * tests_app.lifecycle.grand_test_participation_status) and its
 * authoritative schedule (`test.grand_test_schedule` = {start, end}) — it
 * never computes state from the browser clock. The Start/Continue action
 * itself stays on the detail page's existing `access.can_start` /
 * `can_continue` gate; this panel only explains the state and points to
 * review/result where relevant.
 *
 * Returns null for a non-Grand test, an unscheduled Grand Test, or a
 * missing status — so the caller can render it unconditionally.
 */

function fmt(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Shell({ tone, icon, title, children }) {
  const toneClass =
    tone === "danger"
      ? "border-brand-red bg-brand-red-light/40"
      : tone === "success"
        ? "border-brand-green bg-brand-green-light/40"
        : tone === "live"
          ? "border-amber-400 bg-warning-soft"
          : "border-brand-blue bg-brand-blue/5";
  const iconClass =
    tone === "danger"
      ? "text-brand-red"
      : tone === "success"
        ? "text-brand-green"
        : tone === "live"
          ? "text-amber-700"
          : "text-brand-blue";
  return (
    <div className={`hm-card p-4 sm:p-5 ${toneClass}`} role="status">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white ${iconClass}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[var(--color-text)]">{title}</p>
          <div className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ScheduleLine({ schedule }) {
  if (!schedule?.start || !schedule?.end) return null;
  return (
    <p className="mt-2 font-semibold text-[var(--color-text)]">
      Exam window: {fmt(schedule.start)} &ndash; {fmt(schedule.end)}
    </p>
  );
}

export default function GrandTestStatusPanel({ test }) {
  if (!test || test.exam_type !== "grand") return null;
  const status = test.grand_test_status;
  const schedule = test.grand_test_schedule;
  if (!status || status === "not_scheduled") return null;

  if (status === "upcoming") {
    return (
      <Shell tone="info" icon={<CalendarIcon className="h-5 w-5" />} title="Scheduled Grand Test — not open yet">
        <p>This Grand Test can only be started during its official scheduled window.</p>
        <ScheduleLine schedule={schedule} />
        <p className="mt-2">The Start button will become available when the exam opens.</p>
      </Shell>
    );
  }

  if (status === "live") {
    return (
      <Shell tone="live" icon={<ClockIcon className="h-5 w-5" />} title="This Grand Test is LIVE">
        <p>The official exam window is open now. Start when you&apos;re ready — the deadline below is enforced by the server and a late start does not extend it.</p>
        <ScheduleLine schedule={schedule} />
      </Shell>
    );
  }

  if (status === "in_progress") {
    return (
      <Shell tone="live" icon={<ClockIcon className="h-5 w-5" />} title="Your attempt is in progress">
        <p>Resume below to continue. The official deadline is fixed and shown on the exam screen.</p>
        <ScheduleLine schedule={schedule} />
      </Shell>
    );
  }

  if (status === "completed") {
    const attemptId = test.access?.latest_attempt_id;
    return (
      <Shell tone="success" icon={<CheckCircleIcon className="h-5 w-5" />} title="You completed this Grand Test">
        <p>Your result is saved. Detailed solutions and review open after the exam closes, and stay available for the configured review period.</p>
        {attemptId && (
          <Link
            href={`/tests/result/${attemptId}`}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-blue px-5 text-sm font-bold text-brand-blue"
          >
            View result &amp; review &rarr;
          </Link>
        )}
      </Shell>
    );
  }

  if (status === "missed") {
    return (
      <Shell tone="danger" icon={<WarningTriangleIcon className="h-5 w-5" />} title="You missed this Grand Test">
        <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
          <li>The scheduled exam window has closed, so it can no longer be started.</li>
          <li>No score, rank or percentile is awarded for a missed Grand Test.</li>
          <li>This is not a fail — it means you did not take part.</li>
          <li>Educational review of the questions and solutions may be available after the exam closes.</li>
        </ul>
        <ScheduleLine schedule={schedule} />
        <Link
          href={`/tests/${test.id}/missed-review`}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-red px-5 text-sm font-bold text-brand-red"
        >
          Open Missed Exam Review &rarr;
        </Link>
      </Shell>
    );
  }

  return null;
}
