"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const MODE_ICON = {
  retry_mistakes: "🔄",
  source_weak_areas: "🎯",
  concept_reinforcement: "🧠",
  due_review: "📅",
  new_questions: "🆕",
  bookmarked: "⭐",
  ai_mixed: "🎲",
};

/** The "Intelligent QBank Engine" surface on a Daily/Mock/PYQ/Exam result
 * page — an AI Recommendation card (the single best next step) plus the
 * full Practice Paths grid, both built from real, source-scoped counts.
 * Renders nothing until eligibility is confirmed and never for Grand Test
 * (enforced server-side, this component just reflects that). sourceTestId
 * must be the real Test id the student was just examined on — the backend
 * re-derives exam_type/authorization from it regardless of anything sent
 * here. */
export default function SmartPracticeCard({ sourceTestId }) {
  const router = useRouter();
  const [eligibility, setEligibility] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [starting, setStarting] = useState(null);
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
    setStarting(mode);
    setError("");
    try {
      const session = await api.post("/student/smart-practice/sessions/", { source_test_id: sourceTestId, mode });
      router.push(`/smart-practice/session/${session.id}`);
    } catch (err) {
      setError(err.message || "Couldn't start practice. Please try again.");
      setStarting(null);
    }
  }

  if (!eligibility?.eligible || !recommendations?.modes?.length) return null;

  const [primary, ...paths] = recommendations.modes;

  return (
    <div className="hm-page-narrow flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold text-[var(--color-text)]">🧠 Smart Practice</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Practice what matters most · Based on your performance in {recommendations.source.title}
        </p>
      </div>

      <div className="rounded-xl border border-info/20 bg-info-soft p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-info">🎯 AI Recommendation</p>
        <p className="mt-1 text-sm font-bold text-[var(--color-text)]">
          <span aria-hidden="true">{MODE_ICON[primary.mode]}</span> {primary.label}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{primary.message}</p>
        <button
          type="button"
          onClick={() => start(primary.mode)}
          disabled={!!starting}
          className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {starting === primary.mode
            ? "Starting…"
            : `Start Recommended Practice (${primary.question_count} question${primary.question_count !== 1 ? "s" : ""})`}
        </button>
      </div>

      {paths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Practice Paths</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {paths.map((m) => (
              <button
                key={m.mode}
                type="button"
                onClick={() => start(m.mode)}
                disabled={!!starting}
                className="hm-card flex items-center gap-2.5 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              >
                <span
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-base"
                  aria-hidden="true"
                >
                  {MODE_ICON[m.mode]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight text-[var(--color-text)]">{m.label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {starting === m.mode ? "Starting…" : `${m.question_count} question${m.question_count !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[var(--color-text-muted)]">
        Practicing from: <span className="font-semibold text-[var(--color-text)]">{recommendations.source.title}</span>
      </p>

      {error && <p className="text-xs font-medium text-brand-red">{error}</p>}
    </div>
  );
}
