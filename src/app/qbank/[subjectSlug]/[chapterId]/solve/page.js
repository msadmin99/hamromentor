"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

function SolveContent() {
  const { subjectSlug, chapterId } = useParams();
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const router = useRouter();
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(false);

  // Phase E QA: previously had no .catch() — a failed request left the
  // page on a bare "Loading questions…" forever.
  function load() {
    setQuestions(null);
    setError(false);
    const params = new URLSearchParams({ chapter: chapterId });
    if (topicId) params.set("topic", topicId);
    api
      .get(`/questions/?${params.toString()}`)
      .then(setQuestions)
      .catch(() => setError(true));
  }
  useEffect(load, [chapterId, topicId]);

  return (
    <div className="hm-app-shell">
      <Header title="Solve" showBack />
      {error && (
        <div className="px-4 py-6">
          <ErrorCard title="Unable to load these questions." onRetry={load} />
        </div>
      )}
      {!error && !questions && <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Loading questions…</p>}
      {!error && questions?.length === 0 && (
        <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">
          {topicId ? "No questions for this topic yet." : "No questions in this module yet."}
        </p>
      )}
      {questions?.length > 0 && (
        <QuestionSolver
          questions={questions}
          finishLabel="Done"
          onFinish={() => router.push(`/qbank/${subjectSlug}/${chapterId}`)}
        />
      )}
    </div>
  );
}

export default function SolvePage() {
  return (
    <RequireAuth>
      <SolveContent />
    </RequireAuth>
  );
}
