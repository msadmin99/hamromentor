"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

/**
 * Grand Test 3.0 — Release Candidate integration for the result page.
 *
 * Renders the review-lifecycle banner, the score-band motivation, and the
 * personalized "what to improve next" recommendations — all straight from
 * the backend (TestResultSerializer.review_status / motivation /
 * grand_test_recommendations, produced by GT3-4 and GT3-6). No wording,
 * scoring, or recommendation logic is computed here; the "Practice Now"
 * CTA opens the existing Smart Practice session route
 * (POST /student/smart-practice/grand-test-sessions/), never a second
 * practice engine.
 *
 * Returns null for a non-Grand result (every field below is null/[] for
 * Daily/Mock/PYQ), so the caller can drop it in unconditionally.
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

function ReviewStatusBanner({ status, availableAt, expiresAt }) {
  if (status === "locked") {
    return (
      <div className="rounded-xl border border-info/20 bg-info-soft p-3 text-sm text-[var(--color-text)]">
        Your score, rank and percentile above are final. Detailed solutions and question review open
        {availableAt ? ` on ${fmt(availableAt)}` : " after the exam closes"}.
      </div>
    );
  }
  if (status === "expired") {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text)]">
        Detailed review has expired{expiresAt ? ` (${fmt(expiresAt)})` : ""}. Your result remains available for
        historical performance tracking.
      </div>
    );
  }
  if (status === "available" && expiresAt) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">Detailed review available until {fmt(expiresAt)}.</p>
    );
  }
  return null;
}

function RecommendationCard({ rec }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cta = rec.cta;

  async function practiceNow() {
    setBusy(true);
    setErr("");
    try {
      const session = await api.post("/student/smart-practice/grand-test-sessions/", { test_id: cta.source_test_id });
      router.push(`/smart-practice/session/${session.id}`);
    } catch (e) {
      setErr(e.message || "Couldn't start practice. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">{rec.what}</p>
      <dl className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed">
        <div>
          <dt className="inline font-semibold text-[var(--color-text)]">Why: </dt>
          <dd className="inline text-[var(--color-text-muted)]">{rec.why}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--color-text)]">How: </dt>
          <dd className="inline text-[var(--color-text-muted)]">{rec.how}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--color-text)]">Future benefit: </dt>
          <dd className="inline text-[var(--color-text-muted)]">{rec.future_benefit}</dd>
        </div>
      </dl>

      {cta && cta.action === "practice_now" && (
        <button
          type="button"
          onClick={practiceNow}
          disabled={busy}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-blue px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Starting…" : cta.label || "Practice Now"} →
        </button>
      )}
      {cta && cta.action === "view_exam" && cta.test_id && (
        <Link
          href={`/tests/${cta.test_id}`}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-blue px-5 text-sm font-bold text-brand-blue"
        >
          {cta.label || "View Exam"} →
        </Link>
      )}
      {cta && cta.action === "view_review" && (
        <a
          href="#question-review"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-blue px-5 text-sm font-bold text-brand-blue"
        >
          {cta.label || "View Detailed Review"} ↓
        </a>
      )}
      {err && <p className="mt-2 text-xs font-medium text-brand-red">{err}</p>}
    </div>
  );
}

export default function GrandTestResultExtras({ result }) {
  const motivation = result?.motivation;
  const recommendations = result?.grand_test_recommendations || [];
  const reviewStatus = result?.review_status;

  if (!motivation && recommendations.length === 0 && !reviewStatus) return null;

  return (
    <div className="flex flex-col gap-4">
      <ReviewStatusBanner
        status={reviewStatus}
        availableAt={result?.solutions_available_at}
        expiresAt={result?.review_expires_at}
      />

      {motivation && (
        <div className="hm-card border-brand-blue bg-brand-blue/5 p-4 sm:p-5">
          <p className="text-sm font-extrabold text-[var(--color-text)]">{motivation.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{motivation.message}</p>
          {motivation.recommended_practice_hint && (
            <p className="mt-2 text-xs font-semibold text-[var(--color-text)]">
              Suggested focus: {motivation.recommended_practice_hint}
            </p>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            What to improve next
          </p>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
