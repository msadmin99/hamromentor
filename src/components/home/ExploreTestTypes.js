"use client";

import Link from "next/link";
import { ArchiveIcon, DailyTestIcon, GrandTestIcon, MockTestIcon, QBankIcon, VideosIcon } from "@/components/icons";

const TYPES = [
  { href: "/qbank", label: "Question Bank", Icon: QBankIcon },
  { href: "/mock-test", label: "Mock Test", Icon: MockTestIcon },
  { href: "/daily-test", label: "Daily Test", Icon: DailyTestIcon },
  { href: "/grand-test", label: "Grand Test", Icon: GrandTestIcon },
  { href: "/past-year-questions", label: "Past Year Qs", Icon: ArchiveIcon },
  { href: "/videos", label: "Videos", Icon: VideosIcon },
];

export default function ExploreTestTypes() {
  return (
    <section>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
        <span aria-hidden="true">🗓️</span> Explore by Test Type
      </p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {TYPES.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="hm-card flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center text-[var(--color-text-muted)]" aria-hidden="true">
              <Icon />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-[var(--color-text)]">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
