"use client";

import { TEST_GUIDELINES } from "./examTypeMeta";

export default function TestGuidelines() {
  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">📋 Test Guidelines</p>
      <ul className="mt-3 flex flex-col gap-2">
        {TEST_GUIDELINES.map((guideline) => (
          <li key={guideline} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="mt-0.5 flex-none">•</span>
            {guideline}
          </li>
        ))}
      </ul>
    </div>
  );
}
