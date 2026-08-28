"use client";

import Link from "next/link";
import { EXAM_TYPE_META } from "./testpage/examTypeMeta";

const STATUS_META = {
  available: { label: "Available", icon: "✨", className: "bg-brand-green-light text-brand-green" },
  upcoming: { label: "Upcoming", icon: "🕒", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", icon: "✅", className: "bg-brand-blue/10 text-brand-blue-dark" },
  missed: { label: "Missed", icon: "🔔", className: "bg-brand-red-light text-brand-red" },
  in_progress: { label: "In Progress", icon: "⏳", className: "bg-amber-100 text-amber-700" },
};

const DIFFICULTY_META = {
  easy: { label: "Easy", className: "bg-brand-green-light text-brand-green" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", className: "bg-brand-red-light text-brand-red" },
};

function StatBlock({ icon, value, label }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-2">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-marketing-bar)]/10 text-sm">
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-base font-extrabold text-[var(--color-marketing-bar)]">{value}</p>
        <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

export default function ExamCard({ test }) {
  const meta = EXAM_TYPE_META[test.exam_type] || { label: "Practice", emoji: "🎯", subtitle: "", tagline: "" };
  const status = STATUS_META[test.card_status] || STATUS_META.available;
  const difficulty = DIFFICULTY_META[test.difficulty];
  const locked = test.is_pro && test.card_status !== "completed";
  const attemptsLeft = Math.max(0, (test.max_attempts ?? 1) - (test.attempts_used ?? 0));
  const href = `/tests/${test.id}`;

  let cta = "Start Test";
  let ctaIcon = "🎯";
  if (locked) {
    cta = "Unlock Test";
    ctaIcon = "🔒";
  } else if (test.card_status === "completed") {
    cta = "Review Test";
    ctaIcon = "📖";
  } else if (test.card_status === "in_progress") {
    cta = "Continue Test";
    ctaIcon = "▶️";
  } else if (test.card_status === "missed") {
    cta = "View details";
    ctaIcon = "👀";
  }

  // Titles authored as "Main Title - Subtitle" render as two visual lines
  // (bold navy headline + teal subtitle); a plain title just renders as one.
  const dashIndex = test.title.indexOf(" - ");
  const mainTitle = dashIndex === -1 ? test.title : test.title.slice(0, dashIndex);
  const subTitle = dashIndex === -1 ? "" : test.title.slice(dashIndex + 3);

  return (
    <div className="flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-3.5 shadow-md shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-base shadow-sm"
            style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-marketing-bar) 100%)" }}
          >
            {meta.emoji}
          </span>
          <div>
            <p className="text-xs font-extrabold text-[var(--color-marketing-bar)]">{meta.label}</p>
            {meta.subtitle && <p className="text-[11px] text-[var(--color-text-muted)]">{meta.subtitle}</p>}
          </div>
        </div>
        <span className={`flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
          <span>{status.icon}</span> {status.label}
        </span>
      </div>

      <div className="border-l-4 border-[var(--color-marketing-bar)] pl-2.5">
        <h3 className="text-sm font-extrabold leading-snug text-[var(--color-navy)]">{mainTitle}</h3>
        {subTitle && <p className="text-xs font-bold text-[var(--color-marketing-bar)]">{subTitle}</p>}
      </div>

      <p className="line-clamp-1 text-xs text-[var(--color-text-muted)]">{test.description || meta.tagline}</p>

      <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
        <StatBlock icon="❓" value={test.question_count} label="Questions" />
        <span className="h-8 w-px flex-none bg-[var(--color-border)]" />
        <StatBlock icon="⏱️" value={test.duration_minutes} label="Minutes" />
      </div>

      {test.card_status === "in_progress" && test.in_progress_answered_count != null && test.question_count > 0 && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.min(100, Math.round((test.in_progress_answered_count / test.question_count) * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            {test.in_progress_answered_count} / {test.question_count} answered
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {test.is_pro && (
            <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-brand-green-light text-brand-green">
              👑 PRO
            </span>
          )}
          {difficulty && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${difficulty.className}`}>{difficulty.label}</span>
          )}
          {test.exam_type === "pyq" && test.academic_year && (
            <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-text-muted)]">
              📅 {test.academic_year}
            </span>
          )}
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {test.card_status === "completed" && test.best_score != null
              ? `Best score: ${test.best_score}`
              : `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`}
          </span>
        </div>
        <Link
          href={href}
          className="flex-none rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-marketing-bar)]"
        >
          Details →
        </Link>
      </div>

      <Link
        href={href}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-95"
        style={{ background: "linear-gradient(120deg, var(--color-marketing-bar) 0%, var(--color-exam-card) 100%)" }}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">{ctaIcon}</span>
        {cta}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
