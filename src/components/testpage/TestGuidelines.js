"use client";

import { DocumentIcon } from "@/components/icons";
import { TEST_GUIDELINES } from "./examTypeMeta";

export default function TestGuidelines() {
  return (
    <div className="hm-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
        <DocumentIcon className="h-4 w-4" aria-hidden="true" /> Test Guidelines
      </p>
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
