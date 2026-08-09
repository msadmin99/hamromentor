"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

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

  return (
    <AppShell>
      <Header title={subject?.name || "Subject"} showBack />

      <div className="hm-page flex flex-col gap-2.5">
        {error && <p className="text-sm text-brand-red">{error}</p>}
        {!subject && !error && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subject?.chapters?.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/qbank/${subjectSlug}/${chapter.id}`}
            className="hm-card flex items-center justify-between p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{chapter.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{chapter.mcq_count} MCQs</p>
            </div>
            <span className="ml-2 flex-none text-xs font-semibold text-brand-blue">
              {chapter.solved_count}/{chapter.mcq_count}
            </span>
          </Link>
        ))}
        </div>
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
