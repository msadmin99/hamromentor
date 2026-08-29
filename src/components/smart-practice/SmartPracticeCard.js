"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const MODE_META = {
  retry_mistakes: { icon: "🔄", label: "Retry Mistakes" },
  source_weak_areas: { icon: "🎯", label: "Fix Weak Areas" },
  concept_reinforcement: { icon: "🧠", label: "Strengthen Concepts" },
};

/** Source-scoped Smart Practice CTA — renders nothing until eligibility is
 * confirmed (never a loading flicker for a feature most attempts won't
 * qualify for), and nothing at all for Grand Test or too-few-mistakes
 * attempts. sourceTestId must be the real Test id the student was just
 * examined on; the backend re-derives exam_type/authorization from it
 * server-side regardless of anything sent here. */
export default function SmartPracticeCard({ sourceTestId }) {
  const router = useRouter();
  const [eligibility, setEligibility] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sourceTestId) return;
    api
      .get(`/student/smart-practice/eligibility/?source_test_id=${sourceTestId}`)
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false }));
  }, [sourceTestId]);

  useEffect(() => {
    if (!eligibility?.eligible) return;
    api
      .get(`/student/smart-practice/recommendations/?source_test_id=${sourceTestId}`)
      .then(setRecommendations)
      .catch(() => {});
  }, [eligibility, sourceTestId]);

  async function start(mode) {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const session = await api.post("/student/smart-practice/sessions/", { source_test_id: sourceTestId, mode });
      router.push(`/smart-practice/session/${session.id}`);
    } catch (err) {
      setError(err.message || "Couldn't start practice. Please try again.");
      setStarting(false);
    }
  }

  if (!eligibility?.eligible || !recommendations?.modes?.length) return null;

  const [primary, ...rest] = recommendations.modes;
  const primaryMeta = MODE_META[primary.mode] || {};

  return (
    <div className="hm-page-narrow flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
        🧠 Smart Practice · {recommendations.source.title}
      </p>

      <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4">
        <p className="text-sm font-bold text-[var(--color-text)]">
          <span aria-hidden="true">{primaryMeta.icon}</span> {primaryMeta.label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{primary.message}</p>
        <button
          type="button"
          onClick={() => start(primary.mode)}
          disabled={starting}
          className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {starting ? "Starting…" : `Start Practice (${primary.question_count} question${primary.question_count !== 1 ? "s" : ""})`}
        </button>
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((m) => {
            const meta = MODE_META[m.mode] || {};
            return (
              <button
                key={m.mode}
                type="button"
                onClick={() => start(m.mode)}
                disabled={starting}
                className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text)] disabled:opacity-60"
              >
                <span aria-hidden="true">{meta.icon}</span> {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-medium text-brand-red">{error}</p>}
    </div>
  );
}
