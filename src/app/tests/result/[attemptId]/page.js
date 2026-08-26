"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import PerformanceMessage from "@/components/PerformanceMessage";
import ReferenceCard from "@/components/ReferenceCard";
import ReferencesList from "@/components/ReferencesList";
import ReportQuestionButton from "@/components/ReportQuestionModal";
import RequireAuth from "@/components/RequireAuth";
import RichContent from "@/components/RichContent";
import { api } from "@/lib/api";

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnswersPanel({ counts, filter, onClose, onApply }) {
  const [draft, setDraft] = useState(filter);
  const OPTIONS = [
    { key: "all", label: "All", count: counts.all },
    { key: "correct", label: "Correct", count: counts.correct },
    { key: "wrong", label: "Wrong", count: counts.wrong },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl">
        <p className="border-b border-[var(--color-border)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          Answers
        </p>
        <div className="flex flex-col py-1">
          {OPTIONS.map((opt) => (
            <label key={opt.key} className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                    draft === opt.key ? "border-brand-blue" : "border-[var(--color-border)]"
                  }`}
                >
                  {draft === opt.key && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
                </span>
                <span className="text-[var(--color-text)]">{opt.label}</span>
              </span>
              <span className="text-[var(--color-text-muted)]">({opt.count})</span>
              <input type="radio" name="answers-filter" className="hidden" checked={draft === opt.key} onChange={() => setDraft(opt.key)} />
            </label>
          ))}
        </div>
        <div className="border-t border-[var(--color-border)] p-3">
          <button
            onClick={() => onApply(draft)}
            className="w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white"
          >
            APPLY
          </button>
        </div>
      </div>
    </>
  );
}

const FILTER_LABEL = { all: "All", correct: "Correct", wrong: "Wrong" };

function ResultContent() {
  const { attemptId } = useParams();
  const [filter, setFilter] = useState("all");
  const [panelOpen, setPanelOpen] = useState(false);
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
      <div className="relative">
        <Header
          title="Review"
          showBack
          right={
            <button
              onClick={() => setPanelOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white"
            >
              {FILTER_LABEL[filter]}
              <ChevronDownIcon />
            </button>
          }
        />
        {panelOpen && result && (
          <AnswersPanel
            counts={counts}
            filter={filter}
            onClose={() => setPanelOpen(false)}
            onApply={(next) => {
              setFilter(next);
              setPanelOpen(false);
            }}
          />
        )}
      </div>

      {result && (
        <>
          <div className="hm-page-narrow grid grid-cols-4 gap-2">
            <Stat label="Score" value={`${result.score}/${result.total_marks}`} />
            <Stat label="Rank" value={result.rank ?? "-"} />
            <Stat label="Percentile" value={result.percentile ?? "-"} />
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
          </div>

          <div className="hm-page-narrow flex flex-col gap-3">
            {visibleQuestions.map((q, i) => (
              <div key={q.id} className="hm-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                    <span className="mr-1.5 text-[var(--color-text-muted)]">{i + 1}.</span>
                    <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} />
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <ReportQuestionButton questionId={q.id} />
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
                  {q.options.map((opt) => {
                    const isSelected = q.selected_option_id === opt.id;
                    let classes = "border-[var(--color-border)]";
                    if (opt.is_correct) classes = "border-brand-green bg-brand-green-light";
                    else if (isSelected && !opt.is_correct) classes = "border-brand-red bg-brand-red-light";
                    return (
                      <div key={opt.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${classes}`}>
                        <div className="min-w-0 flex-1">
                          {isSelected && <span className="mb-1 block font-semibold">(your answer)</span>}
                          <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} />
                        </div>
                        {q.stats_available && (
                          <span className="flex-none font-bold">{opt.pick_percentage}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <PerformanceMessage statsAvailable={q.stats_available} correctPercent={q.students_correct_percent} />
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
