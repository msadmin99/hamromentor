"use client";

import RichContent from "@/components/RichContent";
import ReportQuestionButton from "@/components/ReportQuestionModal";
import { BookmarkIcon } from "@/components/icons";

/** One question card — question body (RichContent, untouched, already
 * handles KaTeX/images/video) + option cards with a clear selected-state
 * ring + the Bookmark/Mark for Review/Notes action row. Multi-question
 * pages (Test.questions_per_page > 1) render several of these stacked. */
export default function QuestionWorkspace({
  question,
  questionNumber,
  standalone,
  selectedOptionId,
  onSelectOption,
  marked,
  onToggleMark,
  bookmarked,
  onToggleBookmark,
  onOpenNotes,
  noteSaved,
  priority,
  workspaceRef,
}) {
  return (
    <div ref={workspaceRef} className={standalone ? "" : "hm-card scroll-mt-24 p-4"}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue">Question {questionNumber}</span>
          {question.subject_name && <span className="text-xs text-[var(--color-text-muted)]">{question.subject_name}</span>}
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <ReportQuestionButton questionId={question.id} />
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this question"}
            aria-pressed={bookmarked}
            className={bookmarked ? "text-brand-blue" : "text-[var(--color-text-muted)]"}
          >
            <BookmarkIcon fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={onToggleMark}
            aria-pressed={marked}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
              marked ? "bg-amber-100 text-amber-700" : "text-[var(--color-text-muted)]"
            }`}
          >
            <span aria-hidden="true">🚩</span> {marked ? "Review" : "Mark"}
          </button>
        </div>
      </div>

      <div className="mt-3 text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
        <RichContent html={question.text} latex={question.latex} image={question.image} imageData={question.image_data} priority={priority} />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const selected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectOption(opt.id)}
              aria-pressed={selected}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                selected ? "border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue" : "border-[var(--color-border)] hover:border-brand-blue/40"
              }`}
            >
              <div className="flex gap-2.5 text-[var(--color-text)]">
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-bold ${
                    selected ? "border-brand-blue bg-brand-blue text-white" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <RichContent html={opt.text} latex={opt.latex} image={opt.image} imageData={opt.image_data} className="min-w-0 flex-1" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            bookmarked ? "border-brand-blue text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span> Bookmark
        </button>
        <button
          type="button"
          onClick={onToggleMark}
          aria-pressed={marked}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            marked ? "border-amber-500 bg-amber-50 text-amber-700" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <span aria-hidden="true">🚩</span> Mark for Review
        </button>
        <button
          type="button"
          onClick={onOpenNotes}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            noteSaved ? "border-brand-blue text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <span aria-hidden="true">📝</span> Notes{noteSaved ? " •" : ""}
        </button>
      </div>
    </div>
  );
}
