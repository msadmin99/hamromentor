"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { WarningTriangleIcon } from "@/components/icons";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

/**
 * Grand Test 3.0 — Missed Exam Review.
 *
 * Consumes GET /api/tests/{id}/missed-review/ (the dedicated endpoint
 * from GT3-4). This is EDUCATIONAL review of the questions and
 * solutions — it is NOT an exam result. By construction the backend
 * serializer (MissedReviewQuestionSerializer) carries no student answer,
 * score, rank, percentile or attempt time, and this page never asks for
 * or displays any. The page also surfaces the supportive `motivation`
 * block (general guidance only — GT3-6's missed_student_recommendation,
 * which likewise never fabricates a score for a student who did not sit
 * the exam).
 */

function fmt(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MissedQuestion({ q, index }) {
  return (
    <div className="hm-card p-4">
      <div className="text-sm font-medium text-[var(--color-text)]">
        <span className="mr-1.5 text-[var(--color-text-muted)]">{index + 1}.</span>
        <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {(q.options || []).map((opt, oi) => (
          <div
            key={opt.id}
            className={`rounded-lg border px-3 py-2 text-xs ${
              opt.is_correct ? "border-brand-green bg-brand-green-light" : "border-[var(--color-border)]"
            }`}
          >
            <span className="font-semibold text-[var(--color-text)]">{String.fromCharCode(65 + oi)}. </span>
            <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} className="inline" />
            {opt.is_correct && <span className="ml-1 font-bold text-brand-green">✓ Correct answer</span>}
          </div>
        ))}
      </div>

      {q.explanation && (
        <RichContent
          html={q.explanation}
          latex={q.explanation_latex}
          image={q.explanation_image}
          imageData={q.explanation_image_data}
          video={q.explanation_video_url}
          className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]"
        />
      )}

      {(q.options || []).some((o) => o.explanation && !o.is_correct) && (
        <div className="mt-3 flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            Why the other options are incorrect
          </p>
          {(q.options || []).map((opt, oi) =>
            !opt.explanation || opt.is_correct ? null : (
              <p key={opt.id} className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text)]">{String.fromCharCode(65 + oi)}: </span>
                {opt.explanation}
              </p>
            )
          )}
        </div>
      )}

      {q.key_takeaway && (
        <div className="mt-3 rounded-xl border border-info/20 bg-info-soft p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-info">Key Takeaway</p>
          <p className="text-xs leading-relaxed text-[var(--color-text)]">{q.key_takeaway}</p>
        </div>
      )}
    </div>
  );
}

function MissedReviewContent() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  // State only changes inside .then()/.catch() — no synchronous reset in
  // the body — matching the tests/[id] and result pages' pattern so this
  // is safe to call from an effect and on Retry.
  function load() {
    api
      .get(`/tests/${id}/missed-review/`)
      .then((d) => {
        setData(d);
        setErr(null);
      })
      .catch((e) => setErr(e));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (err) {
    const code = err.data?.code;
    const friendly =
      code === "not_missed"
        ? "You appeared for this Grand Test — open your result page instead."
        : code === "review_locked"
          ? "This Grand Test has not ended yet. Review opens after the exam closes."
          : code === "purchase_required"
            ? "This Grand Test isn't part of your access."
            : err.message;
    return (
      <AppShell>
        <Header title="Missed Exam Review" showBack />
        <div className="hm-page-narrow">
          <ErrorCard title={friendly} subtitle="" onRetry={code ? undefined : load} />
          <Link href={`/tests/${id}`} className="mt-3 block text-center text-sm font-bold text-brand-blue">
            Back to exam details
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <Header title="Missed Exam Review" showBack />
        <div className="hm-page-narrow flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
          ))}
        </div>
      </AppShell>
    );
  }

  const motivation = data.motivation;
  const expired = data.review_status === "expired";
  const questions = data.questions || [];

  return (
    <AppShell>
      <Header title="Missed Exam Review" showBack />
      <div className="hm-page mx-auto flex max-w-[900px] flex-col gap-4">
        {/* Unambiguous framing: educational review, not a result. */}
        <div className="hm-card border-brand-red bg-brand-red-light/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-brand-red">
              <WarningTriangleIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[var(--color-text)]">
                {data.test_title} — Missed Exam Review
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                You did not sit this Grand Test during its scheduled window. This page is educational review of the
                questions and solutions only — there is no score, rank or percentile for a missed exam.
              </p>
              {data.solutions_available_at && (
                <p className="mt-1 text-[11px] font-semibold text-[var(--color-text)]">
                  Solutions released: {fmt(data.solutions_available_at)}
                </p>
              )}
              {data.review_expires_at && (
                <p className="text-[11px] font-semibold text-[var(--color-text)]">
                  Review {expired ? "expired" : "expires"}: {fmt(data.review_expires_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {motivation && (
          <div className="hm-card p-4 sm:p-5">
            <p className="text-sm font-extrabold text-[var(--color-text)]">{motivation.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{motivation.message}</p>
            {motivation.recommended_action && (
              <div className="mt-3 rounded-xl border border-brand-blue/30 bg-brand-blue/5 p-3">
                <p className="text-xs font-bold text-[var(--color-text)]">Suggested next step</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{motivation.recommended_action.reason}</p>
                {motivation.recommended_action.test_id && (
                  <Link
                    href={`/tests/${motivation.recommended_action.test_id}`}
                    className="mt-2 inline-flex min-h-[40px] items-center rounded-lg border border-brand-blue px-4 text-xs font-bold text-brand-blue"
                  >
                    {motivation.recommended_action.title || "View recommended test"} →
                  </Link>
                )}
              </div>
            )}
            {motivation.next_grand_test && (
              <div className="mt-3 rounded-xl border border-[var(--color-border)] p-3">
                <p className="text-xs font-bold text-[var(--color-text)]">Your next Grand Test</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {motivation.next_grand_test.title}
                  {motivation.next_grand_test.scheduled_start && (
                    <> — {fmt(motivation.next_grand_test.scheduled_start)}</>
                  )}
                </p>
                <Link
                  href={`/tests/${motivation.next_grand_test.test_id}`}
                  className="mt-2 inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border)] px-4 text-xs font-bold text-[var(--color-text)]"
                >
                  View details →
                </Link>
              </div>
            )}
          </div>
        )}

        {expired ? (
          <div className="hm-card p-4 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">Detailed review has expired.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              The question-by-question review for this Grand Test is no longer available.
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="hm-card p-4 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No questions are available for review.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </p>
            {questions.map((q, i) => (
              <MissedQuestion key={q.id ?? i} q={q} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function MissedReviewPage() {
  return (
    <RequireAuth>
      <MissedReviewContent />
    </RequireAuth>
  );
}
