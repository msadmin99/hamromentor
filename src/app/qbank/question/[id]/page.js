"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import QuestionSolver from "@/components/QuestionSolver";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function QuestionContent() {
  const { id } = useParams();
  const router = useRouter();
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    api.get(`/questions/${id}/`).then(setQuestion);
  }, [id]);

  return (
    <div className="hm-app-shell">
      <Header title="MCQ of the Day" showBack />
      {!question && <p className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Loading…</p>}
      {question && (
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
