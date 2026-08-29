"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function SmartPracticeSessionContent() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(null);

  useEffect(() => {
    api
      .get(`/student/smart-practice/sessions/${sessionId}/`)
      .then(setSession)
      .catch(() => setError("Couldn't load this practice session."));
  }, [sessionId]);

  async function handleFinish() {
    try {
      const result = await api.post(`/student/smart-practice/sessions/${sessionId}/complete/`);
      setCompleted(result);
    } catch {
      setCompleted({ accuracy: null, score: null });
    }
  }

  return (
    <AppShell>
      <Header title="Smart Practice" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        {error && <p className="hm-card p-4 text-center text-sm text-brand-red">{error}</p>}

        {!error && !session && <p className="hm-card p-4 text-center text-sm text-[var(--color-text-muted)]">Loading…</p>}

        {session && !completed && (
          <>
            <p className="text-xs text-[var(--color-text-muted)]">{session.selection_reason}</p>
            <div className="hm-card min-h-0 flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
              <QuestionSolver
                questions={session.questions.map((sq) => sq.question)}
                onFinish={handleFinish}
                finishLabel="Finish Practice"
                answerUrl={(questionId) => `/student/smart-practice/sessions/${sessionId}/answer/?question_id=${questionId}`}
              />
            </div>
          </>
        )}

        {completed && (
          <div className="hm-card flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-2xl">✓</p>
            <p className="text-base font-bold text-[var(--color-text)]">Practice session complete</p>
            {completed.accuracy != null && (
              <p className="text-sm text-[var(--color-text-muted)]">
                {completed.score} correct · {completed.accuracy}% accuracy
              </p>
            )}
            <Link href="/tests/history" className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white">
              Back to My Tests
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SmartPracticeSessionPage() {
  return (
    <RequireAuth>
      <SmartPracticeSessionContent />
    </RequireAuth>
  );
}
