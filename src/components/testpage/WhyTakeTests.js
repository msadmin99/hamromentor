"use client";

import { EXAM_TYPE_PAGE_META } from "./examTypeMeta";

export default function WhyTakeTests({ examType }) {
  const meta = EXAM_TYPE_PAGE_META[examType] || {};
  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Why Take {meta.shortLabel || "Tests"}?</p>
      <ul className="mt-3 flex flex-col gap-2">
        {(meta.reasons || []).map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <span className="mt-0.5 flex-none font-bold text-brand-blue">✔</span>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
