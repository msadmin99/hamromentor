"use client";

import { EXAM_TYPE_PAGE_META } from "./examTypeMeta";

export default function Illustration({ examType }) {
  const meta = EXAM_TYPE_PAGE_META[examType] || {};
  return (
    <div
      className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl text-3xl shadow-sm sm:h-20 sm:w-20 sm:text-4xl"
      style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-marketing-bar) 100%)" }}
    >
      {meta.icon || "🎯"}
    </div>
  );
}
