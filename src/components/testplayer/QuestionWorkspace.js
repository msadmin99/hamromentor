"use client";

import RichContent from "@/components/RichContent";
import ReportQuestionButton from "@/components/ReportQuestionModal";
import { BookmarkIcon, EditIcon, FlagIcon } from "@/components/icons";

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
              marked ? "bg-warning-soft text-amber-700" : "text-[var(--color-text-muted)]"
            }`}
          >
            <FlagIcon className="h-3.5 w-3.5" aria-hidden="true" /> {marked ? "Review" : "Mark"}
          </button>
        </div>
      </div>

      <div className="mt-3 text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
        <RichContent html={question.text} latex={question.latex} image={question.image} imageData={question.image_data} priority={priority} />
      </div>

      {/* MCQ accessibility remediation.
       *
       * These were <button aria-pressed>, which announces "pressed / not
       * pressed" — the semantics of an independent toggle, not of picking
       * one answer out of four. A screen-reader user got no group, no
       * "1 of 4" position, no mutual exclusivity, and no way to tell that
       * choosing B un-chooses A.
       *
       * Native <input type="radio"> in a <fieldset> rather than
       * role="radiogroup" + role="radio": every question on this platform
       * is single-answer (tests_app.Answer.selected_option is one nullable
       * FK, and no multi-select flag or question type exists anywhere), so
       * the native control is exactly right — and it brings correct role,
       * checked state, group semantics, roving tabindex and arrow-key
       * selection for free, with no hand-rolled ARIA to get wrong.
       *
       * The keyboard model is therefore the platform's own: Tab reaches the
       * group once and lands on the chosen answer (or the first option),
       * Arrow keys move and select within it, Tab leaves. On a
       * 200-question exam that is one tab stop per question instead of one
       * per option.
       *
       * The input is sr-only rather than hidden, so it stays focusable and
       * real; the <label> carries every visual style the old button had, so
       * the design is unchanged. peer-focus-visible puts the focus ring on
       * the label, since the input itself is not what you see. */}
      <fieldset className="mt-4 flex flex-col gap-2.5">
        {/* Concise on purpose: the question text is already read as page
         * content immediately above, so repeating it here would announce
         * the question twice. */}
        <legend className="sr-only">Answer options for question {questionNumber}</legend>
        {question.options.map((opt, i) => {
          const selected = selectedOptionId === opt.id;
          const inputId = `q${question.id}-opt${opt.id}`;
          return (
            <div key={opt.id}>
              <input
                type="radio"
                id={inputId}
                /* One radio group per question — questions_per_page > 1
                 * stacks several of these on one page, and a shared name
                 * would make them a single group where choosing an answer
                 * to question 2 cleared question 1. */
                name={`question-${question.id}`}
                className="peer sr-only"
                checked={selected}
                onChange={() => onSelectOption(opt.id)}
              />
              <label
                htmlFor={inputId}
                className={`block cursor-pointer rounded-xl border px-4 py-3 text-left text-sm transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue ${
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
              </label>
            </div>
          );
        })}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            bookmarked ? "border-brand-blue text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <BookmarkIcon className="h-3.5 w-3.5" fill={bookmarked ? "currentColor" : "none"} /> Bookmark
        </button>
        <button
          type="button"
          onClick={onToggleMark}
          aria-pressed={marked}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            // Was bg-amber-50 (a subtly different amber shade from the
            // bg-amber-100 "Mark for Review" chip above, on the same
            // component) — unified onto the one warning-soft token so
            // both "marked" indicators for this question now render
            // identically instead of two near-matching ad hoc shades.
            marked ? "border-warning bg-warning-soft text-amber-700" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <FlagIcon className="h-3.5 w-3.5" aria-hidden="true" /> Mark for Review
        </button>
        <button
          type="button"
          onClick={onOpenNotes}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
            noteSaved ? "border-brand-blue text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
          }`}
        >
          <EditIcon className="h-3.5 w-3.5" aria-hidden="true" /> Notes{noteSaved ? " •" : ""}
        </button>
      </div>
    </div>
  );
}
