"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import CourseSwitcher from "@/components/CourseSwitcher";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";

const EXAM_TYPES = [
  { href: "/mock-test", label: "Mock Test", emoji: "📝", desc: "Practice anytime, review anytime" },
  { href: "/daily-test", label: "Daily Test", emoji: "⏰", desc: "Timed — available for 24 hours" },
  { href: "/grand-test", label: "Grand Test", emoji: "🏆", desc: "Live exam-window test" },
  { href: "/past-year-questions", label: "Past Year Questions", emoji: "📚", desc: "Previous exam papers" },
];

function ExamsContent() {
  return (
    <AppShell>
      <Header title="Exams" subtitle="Choose an exam type" courseSwitcher={<CourseSwitcher />} />

      <div className="hm-page grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EXAM_TYPES.map((e) => (
          <Link key={e.href} href={e.href} className="hm-card flex items-center gap-3 p-4">
            <span className="text-3xl">{e.emoji}</span>
            <div>
              <p className="text-sm font-bold text-[var(--color-text)]">{e.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{e.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

export default function ExamsPage() {
  return (
    <RequireAuth>
      <ExamsContent />
    </RequireAuth>
  );
}
