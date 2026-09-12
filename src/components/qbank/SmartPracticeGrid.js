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
//
// QBank 2.0 (§8): each tile now carries a `group` ("recommended" |
// "explore") and its own `accent` — reusing this codebase's existing
// semantic color tokens (brand-red/warning/info/brand-green, the same
// ones status badges elsewhere already use), not inventing a new
// palette. Recommended tiles render first, in their own visually
// higher-priority row (tinted card + accent-colored icon badge) — the
// spec's own instruction, since these three are backed by a genuine
// present need (real weak/incorrect/due counts), while Explore's four
// are open-ended browsing.
// Every class string below is written out in full (never assembled via
// string concatenation/`.split()`) so Tailwind's static content scanner —
// which reads source text, it doesn't execute this file — can actually
// see and generate each one. A dynamically-built class name here would
// silently render with no styling at all.
const TILES = [
  {
    key: "weak",
    label: "Fix Weak Areas",
    icon: "🎯",
    status: "weak",
    group: "recommended",
    iconBg: "bg-brand-red-light text-brand-red",
    cardBg: "border-brand-red-light bg-brand-red-light/40",
  },
  {
    key: "need_revision",
    label: "Due for Review",
    icon: "📅",
    status: "need_revision",
    group: "recommended",
    iconBg: "bg-info-soft text-info",
    cardBg: "border-info-soft bg-info-soft",
  },
  {
    key: "incorrect",
    label: "Master Mistakes",
    icon: "🔄",
    status: "incorrect",
    group: "recommended",
    iconBg: "bg-warning-soft text-amber-700",
    cardBg: "border-warning-soft bg-warning-soft/50",
  },
  { key: "strengthen_concepts", label: "Strengthen Concepts", icon: "🧠", group: "explore", iconBg: "bg-violet-100 text-violet-600" },
  { key: "new", label: "New Questions", icon: "🆕", status: "new", group: "explore", iconBg: "bg-brand-green-light text-brand-green" },
  {
    key: "ai_mixed",
    label: "AI Mixed Practice",
    icon: "🎲",
    status: "weak,incorrect,need_revision,new",
    group: "explore",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  { key: "bookmarked", label: "Bookmarked", icon: "⭐", status: "bookmarked", group: "explore", iconBg: "bg-amber-100 text-amber-700" },
];

function hrefFor(status) {
  return status ? `/qbank/practice?status=${status}&auto=1` : "/qbank/practice?auto=1";
}

function Tile({ t, href, count, loading, stats, weakSuggestion, prominent }) {
  const isConceptTile = t.key === "strengthen_concepts";
  const isMixTile = t.key === "ai_mixed";
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-md ${
        prominent ? t.cardBg : "hm-card"
      }`}
    >
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-lg ${t.iconBg}`} aria-hidden="true">
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

  function renderTile(t) {
    const isConceptTile = t.key === "strengthen_concepts";
    const isMixTile = t.key === "ai_mixed";
    const href = isConceptTile
      ? weakSuggestion
        ? `/qbank/practice?subject=${weakSuggestion.subject_id}&auto=1`
        : "/qbank/practice?auto=1"
      : hrefFor(t.status);
    const count = stats && !isConceptTile && !isMixTile ? stats[t.key] : null;
    return (
      <Tile
        key={t.key}
        t={t}
        href={href}
        count={count}
        loading={loading}
        stats={stats}
        weakSuggestion={weakSuggestion}
        prominent={t.group === "recommended"}
      />
    );
  }

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

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Recommended</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">{TILES.filter((t) => t.group === "recommended").map(renderTile)}</div>

      <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Explore</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{TILES.filter((t) => t.group === "explore").map(renderTile)}</div>
    </section>
  );
}
