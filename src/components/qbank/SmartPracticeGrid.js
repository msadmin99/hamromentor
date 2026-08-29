"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

// Global (not tied to one Test) practice paths — every tile except
// "Strengthen Concepts" and "AI Mixed Practice" maps straight onto a real
// /questions/dashboard/ count and a /questions/practice-session/ status
// filter that already existed; AI Mixed reuses the SAME endpoint with
// multiple statuses OR'd together (a deterministic blend, no LLM call —
// consistent with the platform's own rule that AI never performs
// selection). Strengthen Concepts is the one genuinely new path: it
// practices the student's single weakest subject at full breadth (not
// just questions already tagged "weak"), sourced from the same rule-based
// /questions/recommended/ NextPracticeCard already uses.
const TILES = [
  { key: "weak", label: "Fix Weak Areas", icon: "🎯", status: "weak" },
  { key: "incorrect", label: "Master Mistakes", icon: "🔄", status: "incorrect" },
  { key: "strengthen_concepts", label: "Strengthen Concepts", icon: "🧠" },
  { key: "need_revision", label: "Due for Review", icon: "📅", status: "need_revision" },
  { key: "new", label: "New Questions", icon: "🆕", status: "new" },
  { key: "ai_mixed", label: "AI Mixed Practice", icon: "🎲", status: "weak,incorrect,need_revision,new" },
  { key: "bookmarked", label: "Bookmarked", icon: "⭐", status: "bookmarked" },
];

function hrefFor(status) {
  return status ? `/qbank/practice?status=${status}&auto=1` : "/qbank/practice?auto=1";
}

export default function SmartPracticeGrid({ stats, loading }) {
  const { activeCourse } = useCourse();
  const [recommended, setRecommended] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/questions/recommended/?${params.toString()}`)
      .then(setRecommended)
      .catch(() => setRecommended(null));
  }, [activeCourse?.id]);

  const weakSuggestion = recommended?.suggestions?.find((s) => s.subject_id);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">🧠 Intelligent QBank Engine</p>
          <p className="text-xs text-[var(--color-text-muted)]">Practice what matters most</p>
        </div>
        <Link href="/qbank/practice" className="flex-none text-xs font-bold text-brand-blue">
          More options →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TILES.map((t) => {
          const isConceptTile = t.key === "strengthen_concepts";
          const isMixTile = t.key === "ai_mixed";
          const href = isConceptTile
            ? weakSuggestion
              ? `/qbank/practice?subject=${weakSuggestion.subject_id}&auto=1`
              : "/qbank/practice?auto=1"
            : hrefFor(t.status);
          const count = stats && !isConceptTile && !isMixTile ? stats[t.key] : null;
          return (
            <Link
              key={t.key}
              href={href}
              className="hm-card flex items-center gap-2.5 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-lg" aria-hidden="true">
                {t.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-[var(--color-text)]">{t.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isConceptTile
                    ? weakSuggestion?.subject_name
                      ? `Reinforce ${weakSuggestion.subject_name}`
                      : "Reinforce weak concepts"
                    : isMixTile
                      ? "Balanced mix of everything"
                      : loading || !stats
                        ? "…"
                        : `${count ?? 0} question${count === 1 ? "" : "s"}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
