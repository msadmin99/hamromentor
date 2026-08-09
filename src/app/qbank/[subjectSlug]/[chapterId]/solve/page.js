"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function SolveContent() {
  const { subjectSlug, chapterId } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    api.get(`/questions/?chapter=${chapterId}`).then(setQuestions);
  }, [chapterId]);

  return (
    <div className="hm-app-shell">
      <Header title="Solve" showBack />
      {!questions && <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Loading questions…</p>}
      {questions?.length === 0 && (
        <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">No questions in this module yet.</p>
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
