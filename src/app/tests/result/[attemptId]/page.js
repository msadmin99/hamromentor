"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import OptionResultBar from "@/components/OptionResultBar";
import PerformanceMessage from "@/components/PerformanceMessage";
import ReferenceCard from "@/components/ReferenceCard";
import ReferencesList from "@/components/ReferencesList";
import ReportQuestionButton from "@/components/ReportQuestionModal";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "correct", label: "Correct" },
  { key: "wrong", label: "Wrong" },
];

/** Visible All/Correct/Wrong tabs, same pill style as testpage/StatusTabs —
 * replaces the old header dropdown (an extra click to see the same three
 * options wasn't worth it once the answer-review is the main reason a
 * student lands on this page). */
function AnswerFilterTabs({ filter, counts, onChange }) {
  return (
    <div className="hm-page-narrow flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by answer">
      {FILTER_TABS.map((t) => {
        const active = filter === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold transition ${
              active ? "bg-brand-blue text-white" : "bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {t.label} <span className={active ? "text-white/80" : "text-[var(--color-text-muted)]"}>({counts[t.key]})</span>
          </button>
        );
      })}
    </div>
  );
}

function ResultContent() {
  const { attemptId } = useParams();
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/attempts/${attemptId}/result/`).then(setResult);
  }, [attemptId]);

  const counts = useMemo(() => {
    if (!result) return { all: 0, correct: 0, wrong: 0 };
    const all = result.questions.length;
    const correct = result.questions.filter((q) => q.is_correct).length;
    return { all, correct, wrong: all - correct };
  }, [result]);

  const visibleQuestions = useMemo(() => {
    if (!result) return [];
    if (filter === "correct") return result.questions.filter((q) => q.is_correct);
    if (filter === "wrong") return result.questions.filter((q) => !q.is_correct);
    return result.questions;
  }, [result, filter]);

  return (
    <AppShell>
      <Header title="Review" showBack />

      {result && (
        <>
          <div className="hm-page-narrow grid grid-cols-4 gap-2">
            <Stat label="Score" value={`${result.score}/${result.total_marks}`} />
            <Stat label="Rank" value={result.rank ?? "-"} />
            <Stat label="Percentile" value={result.percentile ?? "-"} />
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
          </div>

          <AnswerFilterTabs filter={filter} counts={counts} onChange={setFilter} />

          <div className="hm-page-narrow flex flex-col gap-3">
            {visibleQuestions.map((q, i) => (
              <div key={q.id} className="hm-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                    <span className="mr-1.5 text-[var(--color-text-muted)]">{i + 1}.</span>
                    <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} />
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span
                      className={`flex-none rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        q.is_correct ? "bg-brand-green-light text-brand-green" : "bg-brand-red-light text-brand-red"
                      }`}
                    >
                      {q.is_correct ? "CORRECT" : "WRONG"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = q.selected_option_id === opt.id;
                    const state = opt.is_correct ? "correct" : isSelected ? "wrong-selected" : "neutral";
                    let classes = "border-[var(--color-border)]";
                    if (opt.is_correct) classes = "border-brand-green bg-brand-green-light";
                    else if (isSelected) classes = "border-brand-red bg-brand-red-light";
                    return (
                      <div key={opt.id} className={`rounded-lg border px-3 py-2 text-xs ${classes}`}>
                        {isSelected && <span className="mb-1 block font-semibold text-[var(--color-text)]">(your answer)</span>}
                        <OptionResultBar
                          letter={String.fromCharCode(65 + oi)}
                          option={opt}
                          state={state}
                          percentage={opt.pick_percentage}
                          showStats={q.stats_available}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <PerformanceMessage statsAvailable={q.stats_available} correctPercent={q.students_correct_percent} totalResponses={q.total_responses} />
                </div>

                <RichContent
                  html={q.explanation}
                  latex={q.explanation_latex}
                  image={q.explanation_image}
                  imageData={q.explanation_image_data}
                  video={q.explanation_video_url}
                  className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]"
                />

                {q.options.some((o) => o.explanation && !o.is_correct) && (
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Why the other options are incorrect
                    </p>
                    {q.options.map((opt, oi) =>
                      !opt.explanation || opt.is_correct ? null : (
                        <p key={opt.id} className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                          <span className="font-semibold text-[var(--color-text)]">{String.fromCharCode(65 + oi)}: </span>
                          {opt.explanation}
                        </p>
                      )
                    )}
                  </div>
                )}

                <ReferencesList references={q.references} className="mt-3" />

                {q.key_takeaway && (
                  <div className="mt-3 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue">Key Takeaway</p>
                    <p className="text-xs leading-relaxed text-[var(--color-text)]">{q.key_takeaway}</p>
                  </div>
                )}

                <ReferenceCard
                  bookName={q.reference_book_name}
                  edition={q.reference_edition}
                  chapter={q.reference_chapter}
                  page={q.reference_page}
                  url={q.reference_url}
                  className="mt-3"
                />

                <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                  <ReportQuestionButton questionId={q.id} variant="link" />
                </div>
              </div>
            ))}
            {visibleQuestions.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No questions in this filter.</p>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="hm-card flex flex-col items-center py-3">
      <span className="text-sm font-bold text-[var(--color-text)]">{value}</span>
      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

export default function ResultPage() {
  return (
    <RequireAuth>
      <ResultContent />
    </RequireAuth>
  );
}
