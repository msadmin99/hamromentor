"use client";

import Link from "next/link";
import { ArchiveIcon, DailyTestIcon, GrandTestIcon, MockTestIcon, QBankIcon } from "@/components/icons";

const EXAM_TYPE_META = {
  qbank: { Icon: QBankIcon, bg: "bg-blue-50", fg: "text-brand-blue" },
  daily: { Icon: DailyTestIcon, bg: "bg-orange-50", fg: "text-orange-600" },
  mock: { Icon: MockTestIcon, bg: "bg-violet-50", fg: "text-violet-600" },
  grand: { Icon: GrandTestIcon, bg: "bg-amber-50", fg: "text-amber-700" },
  pyq: { Icon: ArchiveIcon, bg: "bg-rose-50", fg: "text-rose-600" },
};

const DIFFICULTY_META = {
  easy: "bg-brand-green-light text-brand-green",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-brand-red-light text-brand-red",
};

export default function SuggestedTestsRow({ tests }) {
  if (!tests || tests.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
          <span aria-hidden="true">✨</span> Suggested Tests of the Day
        </p>
        <Link href="/mock-test" className="text-xs font-bold text-brand-blue">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tests.map((t) => {
          const meta = EXAM_TYPE_META[t.exam_type] || EXAM_TYPE_META.mock;
          const Icon = meta.Icon;
          return (
            <div key={t.id} className="hm-card flex flex-col gap-3 p-4">
              <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${meta.bg} ${meta.fg}`} aria-hidden="true">
                <Icon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--color-text)]">{t.title}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {t.duration_minutes} mins · {t.question_count} MCQs
                </p>
                {t.difficulty && (
                  <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold capitalize ${DIFFICULTY_META[t.difficulty] || "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}>
                    {t.difficulty}
                  </span>
                )}
              </div>
              <Link href={`/tests/${t.id}`} className="flex items-center gap-1 text-xs font-bold text-brand-blue">
                Start Test <span aria-hidden="true">→</span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
