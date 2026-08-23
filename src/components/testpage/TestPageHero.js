"use client";

import { EXAM_TYPE_META, EXAM_TYPE_PAGE_META } from "./examTypeMeta";

/** Premium banner for the test-listing pages (Mock/Daily/Grand/PYQ) — same
 * visual language as QBankHero/HomeHero (icon in a teal gradient circle,
 * bold headline, muted tagline). Header.js already renders the page's <h1>
 * (e.g. "Mock Test"), so this headline is the punchy subtitle from
 * EXAM_TYPE_META ("Practice & Improve") rather than repeating the title,
 * with EXAM_TYPE_PAGE_META's longer tagline underneath — both shared config,
 * not copy invented here. */
export default function TestPageHero({ examType }) {
  const cardMeta = EXAM_TYPE_META[examType] || {};
  const pageMeta = EXAM_TYPE_PAGE_META[examType] || {};

  return (
    <div className="hm-card relative overflow-hidden p-5 sm:p-6">
      <span
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
        style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl text-3xl text-white shadow-sm sm:h-20 sm:w-20 sm:text-4xl"
          style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
          aria-hidden="true"
        >
          {pageMeta.icon || cardMeta.emoji || "🎯"}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-tight text-[var(--color-text)] sm:text-2xl">
            {cardMeta.subtitle || pageMeta.shortLabel || "Tests"}
          </h2>
          {pageMeta.tagline && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{pageMeta.tagline}</p>}
        </div>
      </div>
    </div>
  );
}
