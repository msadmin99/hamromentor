"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";

function QuestionContent() {
  const { id } = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(false);

  // Phase E QA: previously had no .catch() — a failed request left the
  // page on a bare "Loading…" forever.
  function load() {
    api
      .get(`/questions/${id}/`)
      .then((data) => {
        setQuestion(data);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="hm-app-shell">
      <Header title="MCQ of the Day" showBack />
      {error && (
        <div className="px-4 py-6">
          <ErrorCard title="Unable to load this question." onRetry={load} />
        </div>
      )}
      {!error && !question && <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Loading…</p>}
      {!error && question && (
        <QuestionSolver questions={[question]} finishLabel="Done" onFinish={() => router.push("/home")} />
      )}
    </div>
  );
}

export default function QuestionPage() {
  return (
    <RequireAuth>
      <QuestionContent />
    </RequireAuth>
  );
}
