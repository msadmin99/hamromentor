"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import ChapterGrid from "@/components/qbank/ChapterGrid";
import { api } from "@/lib/api";
import { themeForKey } from "@/lib/theme";

function SubjectContent() {
  const { subjectSlug } = useParams();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/subjects/${subjectSlug}/`)
      .then(setSubject)
      .catch((e) => setError(e.message));
  }, [subjectSlug]);

  const theme = themeForKey(subjectSlug);
  const chapters = subject?.chapters || [];
  const solvedChapters = subject?.solved_modules || 0;
  const totalChapters = subject?.module_count || 0;
  const pct = totalChapters > 0 ? Math.round((solvedChapters / totalChapters) * 100) : 0;

  return (
    <AppShell>
      <Header title={subject?.name || "Subject"} showBack />

      <div className="hm-page flex flex-col gap-4">
        {error && <p className="text-sm text-brand-red">{error}</p>}
        {!subject && !error && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        {subject && (
          <>
            <div className="hm-card relative flex items-center gap-4 overflow-hidden p-4 sm:p-5">
              <span className={`absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-20 ${theme.corner}`} aria-hidden="true" />
              <span
                className={`relative flex h-14 w-14 flex-none items-center justify-center rounded-full text-2xl ${theme.iconBg} ${theme.fg}`}
                aria-hidden="true"
              >
                {subject.icon}
              </span>
              <div className="relative min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--color-text)]">
                  {subject.question_count} MCQs across {totalChapters} {totalChapters === 1 ? "unit" : "units"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="flex-none text-[10px] font-semibold text-[var(--color-text-muted)]">
                    {solvedChapters}/{totalChapters} units started
                  </span>
                </div>
              </div>
            </div>

            {chapters.length > 0 ? (
              <ChapterGrid chapters={chapters} subjectSlug={subjectSlug} icon={subject.icon} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No units added for this subject yet.</p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function SubjectPage() {
  return (
    <RequireAuth>
      <SubjectContent />
    </RequireAuth>
  );
}
