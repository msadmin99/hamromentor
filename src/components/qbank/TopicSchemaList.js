"use client";

import Link from "next/link";
import { ChevronRightIcon, TopicIcon } from "@/components/icons";

/** "Schema" = Topic rows within a Chapter — per Topic's model docstring,
 * these are the important/frequently-asked topics. Each row deep-links into
 * the existing solve flow pre-filtered to that topic (the /questions/
 * endpoint already supports ?topic=), so what used to be inert text rows
 * become real practice entry points. */
export default function TopicSchemaList({ topics, solveHrefFor, theme }) {
  if (!topics || topics.length === 0) return null;

  return (
    <section>
      <div className="mb-1 flex items-center gap-1.5">
        <p className="text-sm font-bold text-[var(--color-text)]">Schema</p>
        <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700">New</span>
      </div>
      <p className="mb-2 text-xs text-[var(--color-text-muted)]">
        Collection of important and repeatedly asked topics from this module.
      </p>
      <div className="hm-card divide-y divide-[var(--color-border)] overflow-hidden">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={solveHrefFor(topic)}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--color-surface-muted)]"
          >
            <span
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${theme.iconBg} ${theme.fg}`}
              aria-hidden="true"
            >
              <TopicIcon />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-text)]">{topic.name}</span>
            <ChevronRightIcon className="flex-none text-[var(--color-text-muted)]" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
