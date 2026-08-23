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

  useEffect(() => {
    api.get("/questions/recommended/").then(setData).catch(() => setData(null));
  }, []);

  if (!data || data.suggestions?.length === 0) return null;

  return (
    <section className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Recommended for You</p>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">Based on your recent performance</p>
      <div className="flex flex-col gap-2">
        {data.suggestions.map((s, i) => (
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
