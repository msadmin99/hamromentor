"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkIcon } from "./icons";
import ReferencesList from "./ReferencesList";
import RichContent from "./RichContent";
import { api } from "@/lib/api";

export default function QuestionSolver({ questions, onFinish, finishLabel = "Finish", timeLimitMinutes }) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes ? Math.round(timeLimitMinutes * 60) : null);
  const scrollRef = useRef(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  useEffect(() => {
    setBookmarked(!!question?.is_bookmarked);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional Timed Practice (Practice Session Builder's "Time" setting) — off
  // by default for every other caller (bookmarks/single-question/chapter solve),
  // so this is additive, not a behavior change for existing usage.
  useEffect(() => {
    if (secondsLeft === null) return undefined;
    if (secondsLeft <= 0) {
      onFinish?.();
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleBookmark() {
    if (bookmarking) return;
    const next = !bookmarked;
    setBookmarked(next); // optimistic — this is a low-stakes toggle, not worth a loading flicker
    setBookmarking(true);
    try {
      await api.post(`/questions/${question.id}/bookmark/`, { bookmark: next });
    } catch {
      setBookmarked(!next); // revert on failure
    } finally {
      setBookmarking(false);
    }
  }

  async function selectOption(option) {
    if (result) return;
    setSelectedId(option.id);
    setSubmitting(true);
    try {
      const res = await api.post(`/questions/${question.id}/answer/`, { option_id: option.id });
      setResult(res);
    } catch {
      // ignore network hiccups in demo
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (isLast) {
      onFinish?.();
      return;
    }
    setIndex((i) => i + 1);
    setResult(null);
    setSelectedId(null);
  }

  if (!question) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="hm-page-narrow min-h-0 flex-1 overflow-y-auto">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[var(--color-text-muted)]">
            {index + 1} of {questions.length} · {question.subject_name}
          </p>
          <div className="flex flex-none items-center gap-3">
            {secondsLeft !== null && (
              <span className={`text-xs font-bold tabular-nums ${secondsLeft <= 30 ? "text-brand-red" : "text-brand-blue"}`}>
                ⏱ {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={toggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
              aria-pressed={bookmarked}
              className={`flex-none rounded-full p-1 transition ${bookmarked ? "text-brand-blue" : "text-[var(--color-text-muted)]"}`}
            >
              <BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        <div className="text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
          <RichContent html={question.text} latex={question.latex} image={question.image} imageData={question.image_data} priority />
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selectedId === opt.id;
            const isCorrectOption = result && opt.id === result.correct_option_id;
            const isWrongSelected = result && isSelected && !result.is_correct;

            let stateClasses = "border-[var(--color-border)]";
            if (isCorrectOption) stateClasses = "border-brand-green bg-brand-green-light";
            else if (isWrongSelected) stateClasses = "border-brand-red bg-brand-red-light";
            else if (isSelected) stateClasses = "border-brand-blue";

            return (
              <button
                key={opt.id}
                onClick={() => selectOption(opt)}
                disabled={!!result || submitting}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${stateClasses}`}
              >
                <div className="flex min-w-0 flex-1 gap-1.5 text-[var(--color-text)]">
                  <span className="flex-none font-semibold">{String.fromCharCode(65 + i)})</span>
                  <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} className="min-w-0 flex-1" />
                </div>
                {result && (isCorrectOption || isWrongSelected) && (
                  <span className="text-xs font-bold">
                    {isCorrectOption ? "✓" : "✕"} {opt.pick_percentage}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {result && (
          <div className="mt-4 rounded-xl bg-[var(--color-surface-muted)] p-4">
            <p className={`mb-2 text-sm font-bold ${result.is_correct ? "text-brand-green" : "text-brand-red"}`}>
              {result.is_correct ? "Correct!" : "Incorrect"}
            </p>
            <RichContent
              html={result.explanation}
              latex={result.explanation_latex}
              image={result.explanation_image}
              imageData={result.explanation_image_data}
              video={result.explanation_video_url}
              className="text-sm leading-relaxed text-[var(--color-text-muted)]"
            />
            <ReferencesList references={result.references} className="mt-3" />
            <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">MCQ ID: {question.public_id}</p>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-white px-4 py-3">
        <div className="mx-auto max-w-[44rem]">
          <button
            onClick={goNext}
            disabled={!result}
            className="w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {isLast ? finishLabel : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
