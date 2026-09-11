"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function hrefFor(params) {
  const qs = new URLSearchParams();
  if (params?.subject) qs.set("subject", params.subject);
  if (params?.topic) qs.set("topic", params.topic);
  if (params?.status) qs.set("status", params.status);
  qs.set("auto", "1");
  return `/qbank/practice?${qs.toString()}`;
}

/** Rule-based suggestions from the student's own performance data — see
 * QuestionViewSet.recommended() on the backend. Never fabricated; when
 * there isn't enough data yet the API itself falls back to a single
 * "Start with New Questions" suggestion rather than this component
 * inventing one. */
export default function RecommendedForYou() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/questions/recommended/")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // While loading, this card previously rendered nothing at all (falling
  // through to the `!data` branch below) — meaning it occupied ZERO
  // height until the fetch resolved, then popped in at its full ~180px
  // the instant data arrived, mid-page, with no warning. That's the
  // largest version of the layout-shift bug fixed across this file: see
  // ProgressSummary.js for the full mechanism (confirmed via screen-
  // recording analysis) — a height change landing while the user is
  // mid-scroll can outrun the browser's paint, leaving a blank gap until
  // a later repaint catches up. A genuinely-empty result (no suggestions)
  // still collapses to nothing below, unchanged — that's a real, stable
  // state, not a loading flicker, and reserving space for it forever
  // would be wrong.
  if (loading) {
    return (
      <section className="hm-card animate-pulse p-4">
        <div className="h-4 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mb-3 mt-1.5 h-3 w-40 rounded bg-[var(--color-surface-muted)]" />
        <div className="flex flex-col gap-2">
          <div className="h-11 rounded-xl bg-[var(--color-surface-muted)]" />
          <div className="h-11 rounded-xl bg-[var(--color-surface-muted)]" />
          <div className="h-11 rounded-xl bg-[var(--color-surface-muted)]" />
        </div>
      </section>
    );
  }

  if (!data || data.suggestions?.length === 0) return null;
  const topSuggestions = data.suggestions.slice(0, 3);

  return (
    <section className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Recommended for You</p>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">Based on your recent performance</p>
      <div className="flex flex-col gap-2">
        {topSuggestions.map((s, i) => (
          <Link
            key={i}
            href={hrefFor(s.practice_params)}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 transition hover:border-brand-blue"
          >
            <span className="min-w-0 text-sm text-[var(--color-text)]">{s.message}</span>
            <span className="flex-none text-brand-blue" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
