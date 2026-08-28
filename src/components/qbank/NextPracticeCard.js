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

  if (loading) {
    return (
      <div className="hm-card animate-pulse p-5 sm:p-6">
        <div className="h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-3 h-6 w-64 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-6 h-10 w-40 rounded-xl bg-[var(--color-surface-muted)]" />
      </div>
    );
  }

  const top = data?.suggestions?.[0];
  const isRealPractice = top && top.type !== "start_new";
  const area = top ? weakAreaLabel(top) : null;

  return (
    <div className="hm-card p-5 sm:p-6">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span aria-hidden="true">🎯</span> Your Next Practice
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

        {isRealPractice && top.accuracy_pct != null && (
          <AccuracyRing percent={Math.round(top.accuracy_pct)} label="Accuracy" />
        )}
      </div>
    </div>
  );
}
