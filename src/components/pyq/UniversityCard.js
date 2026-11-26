"use client";

import Link from "next/link";
import { BuildingIcon, DocumentIcon } from "@/components/icons";

export default function UniversityCard({ university }) {
  return (
    <div className="hm-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
          aria-hidden="true"
        >
          <BuildingIcon className="h-5 w-5" />
        </span>
        <p className="min-w-0 truncate text-sm font-bold text-[var(--color-text)]">{university.name}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div>
          <p className="text-[10px] uppercase tracking-wide">Years Available</p>
          <p className="text-sm font-bold text-[var(--color-text)]">{university.years_available}</p>
        </div>
        <div className="flex items-center gap-1">
          <DocumentIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {university.paper_count}+ Papers
        </div>
      </div>

      <Link
        href={`/past-year-questions/${encodeURIComponent(university.name)}`}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue-dark py-2.5 text-sm font-bold text-white transition hover:brightness-110"
      >
        Explore <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
