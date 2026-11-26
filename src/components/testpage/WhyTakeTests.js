"use client";

import { ChartIcon, CheckCircleIcon, ClockIcon, SearchIcon, TargetIcon } from "@/components/icons";
import { EXAM_TYPE_PAGE_META } from "./examTypeMeta";

// Compact, non-dominant per the redesign spec — a checklist on desktop, a
// scannable icon-tile grid on mobile (same underlying reasons list either
// way, no separate copy to keep in sync).
const REASON_ICONS = [TargetIcon, ClockIcon, SearchIcon, ChartIcon];

export default function WhyTakeTests({ examType }) {
  const meta = EXAM_TYPE_PAGE_META[examType] || {};
  const reasons = meta.reasons || [];

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Why Take {meta.shortLabel || "Tests"}?</p>

      <ul className="mt-3 hidden flex-col gap-2 sm:flex">
        {reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-none text-brand-blue" aria-hidden="true" />
            {reason}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
        {reasons.map((reason, i) => {
          const ReasonIcon = REASON_ICONS[i % REASON_ICONS.length];
          return (
            <div key={reason} className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-3 text-center">
              <ReasonIcon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
              <span className="text-[11px] font-semibold leading-tight text-[var(--color-text)]">{reason}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
