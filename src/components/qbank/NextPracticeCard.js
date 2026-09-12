"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AccuracyRing from "./AccuracyRing";

function hrefFor(params) {
  const qs = new URLSearchParams();
  if (params?.subject) qs.set("subject", params.subject);
  if (params?.topic) qs.set("topic", params.topic);
  if (params?.status) qs.set("status", params.status);
  qs.set("auto", "1");
  return `/qbank/practice?${qs.toString()}`;
}

function weakAreaLabel(top) {
  return top.topic_name || top.subject_name || null;
}

/** The dominant "what should I practice right now" card — built from the
 * same real, rule-based GET /questions/recommended/ RecommendedForYou.js
 * already uses, reading its top suggestion's now-enriched accuracy_pct/
 * question_count/estimated_minutes fields. */
export default function NextPracticeCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/questions/recommended/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Reserves space for the tallest common loaded shape (title + weak-area
  // line + meta row + button, with the accuracy ring stacked below on
  // mobile where this card is flex-col) — not just a generic placeholder.
  // This card sits highest in the scrollable content (right after the
  // search bar), so an async height jump here shifts every card below it
  // at once; matching the skeleton's height to the real content avoids
  // that shift regardless of when /questions/recommended/ resolves
  // relative to the user's scroll position. See ProgressSummary.js for
  // the full mechanism this fixes (confirmed via screen-recording
  // analysis of the reported mobile scroll bug).
  if (loading) {
    return (
      <div className="hm-card animate-pulse p-5 sm:p-6">
        <div className="h-3 w-40 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-6 w-64 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-3 h-4 w-48 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-4 h-10 w-40 rounded-xl bg-[var(--color-surface-muted)]" />
          </div>
          <div className="h-28 w-28 flex-none rounded-full bg-[var(--color-surface-muted)]" />
        </div>
      </div>
    );
  }

  const top = data?.suggestions?.[0];
  const isRealPractice = top && top.type !== "start_new";
  const area = top ? weakAreaLabel(top) : null;

  return (
    // QBank 2.0 visual QA (Qbank12.png): this card reads as a plain white
    // hm-card identical to every other card on the page today — the
    // reference gives "Next Best Action" its own light blue tint so it
    // stands out as the page's single top recommendation. Reusing the
    // existing --color-info/--color-info-soft tokens (the same ones the
    // "Exam Pearl" callout in QuestionSolver already tints with), not a
    // new color. `!` overrides keep hm-card's shared radius/border-width
    // mechanics (and ScrollDiagnostics' `.hm-card` matcher) intact.
    <div className="hm-card !border-info-soft !bg-info-soft p-5 sm:p-6">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span aria-hidden="true">🎯</span> Your Next Best Action
      </p>

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {isRealPractice ? (
            <>
              <p className="text-lg font-extrabold text-[var(--color-text)]">
                {top.question_count ? `${top.question_count} question${top.question_count === 1 ? "" : "s"} need attention` : top.message}
              </p>
              {area && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Weak area: <span className="font-semibold text-[var(--color-text)]">{area}</span>
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
                {top.estimated_minutes != null && (
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">⏱</span> ~{top.estimated_minutes} min
                  </span>
                )}
                {top.question_count ? (
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">📋</span> {top.question_count} Questions
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-extrabold text-[var(--color-text)]">You&apos;re all caught up 🎉</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Try a fresh set of questions.</p>
            </>
          )}

          <Link
            href={top ? hrefFor(top.practice_params) : "/qbank/practice?status=new&auto=1"}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Start Practice
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {isRealPractice && top.accuracy_pct != null ? (
          <AccuracyRing percent={Math.round(top.accuracy_pct)} label="Accuracy" />
        ) : (
          // Fourth-stage mobile scroll fix. The skeleton above always
          // reserves this 112px (h-28 w-28) ring slot, but until now the
          // loaded content only rendered it for a `revise_topic`/
          // `improve_subject` top suggestion — never for `retry_mistakes`,
          // `new_subject`, or `start_new` (confirmed against
          // academics/views.py's recommended(): only those first two types
          // ever set an `accuracy` key). `start_new` is exactly the
          // suggestion every brand-new/lightly-active student gets (no
          // subject with 3+ attempts yet) — an everyday case, not an edge
          // case. That made this card shrink by ~130px the instant
          // /questions/recommended/ resolved for that student, the same
          // mid-scroll-layout-shift mechanism ProgressSummary was fixed
          // for earlier (see its own comment), just running in reverse.
          // This invisible spacer keeps the card's shape identical to its
          // own skeleton in every case, so there is never a transition to
          // fix regardless of which suggestion type loads.
          <div className="h-28 w-28 flex-none" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
