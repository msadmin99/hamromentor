"use client";

import { useState } from "react";
import ExplanationDisplay from "./ExplanationDisplay";
import OptionResultBar from "./OptionResultBar";
import RichContent from "./RichContent";
import { api } from "@/lib/api";

function letterFor(i) {
  return String.fromCharCode(65 + i);
}

/**
 * Public "MCQ of the Day" quiz — select-then-change-then-Submit-Test,
 * graded by the backend, solutions revealed only in that response.
 *
 * Deliberately NOT QuestionSolver: QuestionSolver POSTs each answer to an
 * authenticated /questions/{id}/answer/ endpoint and reveals correctness
 * immediately, one question at a time — exactly the private QBank
 * behavior (mastery updates, attempt persistence, revision scheduling)
 * this public feature must NOT trigger for an anonymous visitor (product
 * spec §7). This component never touches that endpoint at all.
 *
 * `questions` (the initial GET's payload) never carries is_correct or any
 * explanation — the backend won't reveal those until POST
 * /mcq-of-the-day-set/ grades the whole submitted set at once, and THAT
 * response (not local comparison) is what drives the result view. So
 * nothing here computes correctness itself; it only renders whatever the
 * server said.
 *
 * Reuses the same lower-level, presentation-only pieces the authenticated
 * flow uses — RichContent, OptionResultBar, ExplanationDisplay — so both
 * surfaces still look and read identically (spec §6/§7: "reuse ... where
 * technically appropriate").
 */
export default function PublicMcqQuiz({ questions, coursePrefix, onFinish, finishLabel = "Choose a different program" }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionId
  const [result, setResult] = useState(null); // backend's graded response, or null pre-submit
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const isLast = index === questions.length - 1;
  const isFirst = index === 0;

  function selectOption(q, optionId) {
    // Spec §3: "allow changing an answer before submission" — this is a
    // plain state update, always overwritable, right up until Submit.
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
  }

  async function doSubmit() {
    setSubmitting(true);
    setSubmitError(false);
    try {
      // The server re-derives its own authoritative 5-question set from
      // (course, today) and grades against THAT — it never trusts
      // anything here beyond "which option did the visitor pick for
      // which question id" (see DailyMCQSetView.post()).
      const payload = {
        course: coursePrefix,
        answers: questions.map((q) => ({ question_id: q.id, option_id: answers[q.id] ?? null })),
      };
      const graded = await api.post("/mcq-of-the-day-set/", payload);
      setResult(graded);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function attemptSubmit() {
    if (answeredCount < questions.length) {
      setConfirmingSubmit(true);
      return;
    }
    doSubmit();
  }

  if (!question) return null;

  if (result) {
    return <PublicMcqResults result={result} onFinish={onFinish} finishLabel={finishLabel} />;
  }

  const progressPct = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hm-page-narrow min-h-0 flex-1 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--color-text)]">
            Question {index + 1} of {questions.length}
          </p>
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">
            Answered: {answeredCount}/{questions.length}
          </p>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-brand-blue transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        {question.subject_name && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-semibold text-info">
              {question.subject_name}
            </span>
          </div>
        )}

        <div className="text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
          <RichContent html={question.text} latex={question.latex} image={question.image} imageData={question.image_data} priority />
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const isSelected = answers[question.id] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => selectOption(question, opt.id)}
                aria-pressed={isSelected}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition ${
                  isSelected ? "border-brand-blue bg-brand-blue/5" : "border-[var(--color-border)]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    isSelected ? "border-brand-blue bg-brand-blue text-white" : "border-[var(--color-border)] text-[var(--color-text)]"
                  }`}
                >
                  {letterFor(i)}
                </span>
                <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} className="min-w-0 flex-1" />
              </button>
            );
          })}
        </div>

        {submitError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand-red bg-brand-red-light px-4 py-3">
            <p className="text-sm font-semibold text-brand-red">Couldn&apos;t submit your answers. Check your connection and try again.</p>
            <button
              type="button"
              onClick={doSubmit}
              disabled={submitting}
              className="flex-none rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Retrying…" : "Try Again"}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-white px-4 py-3">
        {/* Desktop audit (2026-09-28): kept in sync with .hm-page-narrow's
            own breakpoints/values (globals.css) by hand — see the
            identical note in QuestionSolver.js's own action bar. */}
        <div className="mx-auto flex max-w-[44rem] items-center gap-3 xl:max-w-[62rem] 2xl:max-w-[70rem]">
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            disabled={isFirst}
            className="flex-none rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text)] disabled:opacity-40"
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            disabled={isLast}
            className="flex-1 rounded-xl border border-brand-blue px-4 py-3 text-sm font-bold text-brand-blue disabled:opacity-40"
          >
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-[44rem] xl:max-w-[62rem] 2xl:max-w-[70rem]">
          <button
            type="button"
            onClick={attemptSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </div>

      {confirmingSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <p className="text-sm font-bold text-[var(--color-text)]">
              You have not answered all {questions.length} questions. Submit anyway?
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Answered: {answeredCount}/{questions.length}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingSubmit(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-bold text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingSubmit(false);
                  doSubmit();
                }}
                className="flex-1 rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PublicMcqResults({ result, onFinish, finishLabel }) {
  const questions = result.questions;

  return (
    <div className="hm-page-narrow flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">MCQ of the Day — Result</p>
        <p className="mt-1 text-3xl font-extrabold text-[var(--color-text)]">
          Score: {result.score}/{result.total}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <span className="text-brand-green">Correct: {result.correct_count}</span>
          <span className="text-brand-red">Incorrect: {result.incorrect_count}</span>
          <span className="text-[var(--color-text-muted)]">Unanswered: {result.unanswered_count}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => {
          const correctIdx = q.options.findIndex((o) => o.is_correct);
          const selectedIdx = q.options.findIndex((o) => o.id === q.selected_option_id);
          return (
            <div key={q.id} className="rounded-2xl border border-[var(--color-border)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${
                    q.is_correct ? "bg-brand-green" : q.is_answered ? "bg-brand-red" : "bg-[var(--color-text-muted)]"
                  }`}
                >
                  {q.is_correct ? "✓" : q.is_answered ? "✕" : "–"}
                </span>
                <p className="text-sm font-bold text-[var(--color-text)]">
                  Q{i + 1} {q.is_correct ? "Correct" : q.is_answered ? "Incorrect" : "Unanswered"}
                </p>
              </div>

              <RichContent html={q.text} latex={q.latex} image={q.image} imageData={q.image_data} className="text-sm" />

              <div className="mt-3 flex flex-col gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = q.selected_option_id === opt.id;
                  const state = opt.is_correct ? "correct" : isSelected ? "wrong-selected" : "neutral";
                  const stateClasses =
                    state === "correct"
                      ? "border-brand-green bg-brand-green-light"
                      : state === "wrong-selected"
                        ? "border-brand-red bg-brand-red-light"
                        : "border-[var(--color-border)]";
                  return (
                    <div key={opt.id} className={`rounded-xl border px-3.5 py-2.5 text-sm ${stateClasses}`}>
                      <OptionResultBar letter={letterFor(oi)} option={opt} state={state} showStats={false} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-[var(--color-text-muted)]">
                <span>Your answer: {q.is_answered ? letterFor(selectedIdx) : "—"}</span>
                <span>Correct answer: {correctIdx > -1 ? letterFor(correctIdx) : "—"}</span>
              </div>

              <div className="mt-4">
                <ExplanationDisplay
                  explanation={q.explanation}
                  explanationLatex={q.explanation_latex}
                  explanationImage={q.explanation_image}
                  explanationImageData={q.explanation_image_data}
                  explanationVideoUrl={q.explanation_video_url}
                  keyTakeaway={q.key_takeaway}
                  referenceBookName={q.reference_book_name}
                  referenceEdition={q.reference_edition}
                  referenceChapter={q.reference_chapter}
                  referencePage={q.reference_page}
                  referenceUrl={q.reference_url}
                  references={q.references}
                  options={q.options.map((opt, oi) => ({
                    id: opt.id,
                    letter: letterFor(oi),
                    text: opt.text,
                    latex: opt.latex,
                    isCorrect: opt.is_correct,
                    explanation: opt.explanation || "",
                  }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onFinish}
        className="self-center rounded-xl border border-brand-blue px-6 py-3 text-sm font-bold text-brand-blue"
      >
        {finishLabel}
      </button>
    </div>
  );
}
