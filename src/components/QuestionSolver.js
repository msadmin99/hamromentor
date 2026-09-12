"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MASTERY_META } from "./qbank/revisionListShared";
import { BookmarkIcon } from "./icons";
import OptionResultBar from "./OptionResultBar";
import PerformanceMessage from "./PerformanceMessage";
import ReferenceCard from "./ReferenceCard";
import ReferencesList from "./ReferencesList";
import ReportQuestionButton from "./ReportQuestionModal";
import RichContent from "./RichContent";
import { api } from "@/lib/api";

const CONFIDENCE_OPTIONS = [
  { key: "guess", label: "Guessing", icon: "🙂" },
  { key: "unsure", label: "Somewhat confident", icon: "😐" },
  { key: "confident", label: "Very confident", icon: "😎" },
];

// Question.DIFFICULTY_CHOICES (academics/models.py) — same five values,
// same labels, just friendlier casing than the raw enum key. Prefer the
// teacher's own instructor_difficulty (populated at creation for most
// questions); actual_difficulty (performance-derived) is the fallback,
// never the other way around, so an early-life question with few
// attempts doesn't show a difficulty computed from a handful of tries.
const DIFFICULTY_LABEL = {
  very_easy: "Very Easy", easy: "Easy", medium: "Moderate", hard: "Difficult", very_hard: "Very Difficult",
};

function letterFor(i) {
  return String.fromCharCode(65 + i);
}

// Question.QUESTION_TYPE_CHOICES — only the two the reference calls out as
// meaningful context ("image-based", "calculation"); conceptual/recall/
// clinical/other aren't distinguishing signals worth a chip.
const TYPE_META = {
  numerical: { icon: "🧮", label: "Calculation" },
  image_based: { icon: "🖼", label: "Image-based" },
};

function Chip({ children, tone = "neutral" }) {
  const toneClass = tone === "brand" ? "bg-info-soft text-info" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>{children}</span>;
}

// Purely decorative variety for "why other options are wrong" cards
// (Qbank12.png: each wrong option gets its own pastel badge color, not a
// uniform one) — literal classes only, cycled by position among the
// wrong options actually shown, never tied to a fixed letter.
const WRONG_OPTION_BADGES = [
  "bg-brand-red-light text-brand-red",
  "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600",
  "bg-warning-soft text-amber-700",
];

// revision_due_at is a real timestamp (academics/services.py:
// record_question_result) — this only turns it into a relative label, it
// never invents a date. Overdue and "due today" both read as "Due now"
// rather than a confusing negative day count.
function formatRevisionDue(iso) {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays <= 0) return "Due now";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

function formatEventDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// "Practice This Concept" (§2E): scoped to the same topic first — falling
// back to chapter, then subject, whichever this question actually has —
// reusing the existing, already-authorized Practice Session Builder
// (/qbank/practice + POST /questions/practice-session/) instead of a new
// recommendation endpoint. This only ever narrows to real fields already
// present on `question`; it can't invent a relationship the question
// doesn't have.
function similarPracticeHref(question) {
  const params = new URLSearchParams();
  if (question.topic) params.set("topic", question.topic);
  else if (question.chapter) params.set("chapter", question.chapter);
  else if (question.subject) params.set("subject", question.subject);
  else return null;
  params.set("auto", "1");
  return `/qbank/practice?${params.toString()}`;
}

export default function QuestionSolver({
  questions,
  onFinish,
  finishLabel = "Finish",
  timeLimitMinutes,
  answerUrl = (questionId) => `/questions/${questionId}/answer/`,
}) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // QBank 2.0 (§17): a failed answer submission used to be swallowed
  // silently ("ignore network hiccups in demo") — the student's tap
  // registered visually (selectedId was already set optimistically) but
  // no `result` ever arrived, so the Next button stayed disabled forever
  // with zero explanation. Now the failure is surfaced with a Retry
  // action, and the selection itself is never cleared, so retrying
  // resubmits the same option instead of making the student re-pick.
  const [submitError, setSubmitError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes ? Math.round(timeLimitMinutes * 60) : null);
  // Phase 2F: back-navigation ("← Previous") must show what the student
  // already did on a question, not erase it — this caches each answered
  // question's {selectedId, result, confidence} by question id so
  // revisiting it (either direction) restores the exact same state
  // instead of presenting it as fresh/unanswered.
  const [answers, setAnswers] = useState({});
  const scrollRef = useRef(null);
  const questionShownAtRef = useRef(Date.now());

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isFirst = index === 0;

  useEffect(() => {
    const cached = answers[question?.id];
    setSelectedId(cached?.selectedId ?? null);
    setResult(cached?.result ?? null);
    setConfidence(cached?.confidence ?? null);
    setBookmarked(!!question?.is_bookmarked);
    setSubmitError(false);
    questionShownAtRef.current = Date.now();
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

  async function submitConfidence(value) {
    setConfidence(value); // optimistic — this is a low-stakes, optional self-report
    setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], confidence: value } }));
    try {
      await api.post(`/questions/${question.id}/confidence/`, { confidence: value });
    } catch {
      // non-critical; leave the optimistic selection as-is
    }
  }

  async function selectOption(option) {
    if (result) return;
    setSelectedId(option.id);
    setSubmitError(false);
    setSubmitting(true);
    try {
      const time_taken_seconds = Math.round((Date.now() - questionShownAtRef.current) / 1000);
      const res = await api.post(answerUrl(question.id), { option_id: option.id, time_taken_seconds });
      setResult(res);
      setAnswers((prev) => ({ ...prev, [question.id]: { selectedId: option.id, result: res, confidence: null } }));
    } catch {
      // Keep selectedId as-is — the student's choice stays visible and
      // Retry resubmits it without asking them to pick again.
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function retrySubmit() {
    const option = question.options.find((o) => o.id === selectedId);
    if (option) selectOption(option);
  }

  function goNext() {
    if (isLast) {
      onFinish?.();
      return;
    }
    setIndex((i) => i + 1);
  }

  function goPrevious() {
    if (isFirst) return;
    setIndex((i) => i - 1);
  }

  if (!question) return null;

  const progressPct = Math.round(((index + 1) / questions.length) * 100);
  const difficultyKey = question.instructor_difficulty || question.actual_difficulty;
  const typeMeta = TYPE_META[question.question_type];
  const hasMetaRow = question.topic_name || difficultyKey || typeMeta;

  const correctIdx = result ? question.options.findIndex((o) => o.id === result.correct_option_id) : -1;
  const selectedIdx = result ? question.options.findIndex((o) => o.id === selectedId) : -1;
  const correctOpt = correctIdx > -1 ? question.options[correctIdx] : null;
  const selectedOpt = selectedIdx > -1 ? question.options[selectedIdx] : null;

  const masteryMeta = result?.mastery_status ? MASTERY_META[result.mastery_status] : null;
  const revisionLabel = result ? formatRevisionDue(result.revision_due_at) : null;
  const similarHref = similarPracticeHref(question);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="hm-page-narrow min-h-0 flex-1 overflow-y-auto">
        {/* Phase 2A: progress + timer + bookmark/report, replacing the old
            plain "N of M · Subject" line with an explicit "Question N of M"
            label and a real progress bar (Qbank12.png §2A). */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--color-text)]">
            Question {index + 1} of {questions.length}
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
            <ReportQuestionButton questionId={question.id} />
          </div>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-brand-blue transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Phase 2A: question context metadata, styled as pill chips
            matching Qbank12.png — only fields that actually exist on this
            question render; nothing here is invented (no High Yield chip
            — Question has no such field). Subject/chapter get the brand
            tint (the reference's primary classification); topic/
            difficulty/type stay neutral (secondary attributes). */}
        {(question.subject_name || hasMetaRow) && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {question.subject_name && <Chip tone="brand">{question.subject_name}</Chip>}
            {question.chapter_name && <Chip tone="brand">{question.chapter_name}</Chip>}
            {question.topic_name && <Chip>{question.topic_name}</Chip>}
            {difficultyKey && <Chip>{DIFFICULTY_LABEL[difficultyKey] || difficultyKey}</Chip>}
            {typeMeta && (
              <Chip>
                <span aria-hidden="true">{typeMeta.icon}</span> {typeMeta.label}
              </Chip>
            )}
          </div>
        )}

        <div className="text-[15px] font-medium leading-relaxed text-[var(--color-text)]">
          <RichContent html={question.text} latex={question.latex} image={question.image} imageData={question.image_data} priority />
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selectedId === opt.id;
            const isCorrectOption = result && opt.id === result.correct_option_id;
            const isWrongSelected = result && isSelected && !result.is_correct;
            // Stats (and per-option "why wrong") only exist in `result`,
            // returned only after this student has actually answered — the
            // pre-submission `question` prop never carries pick_percentage.
            const optResult = result?.options?.find((o) => o.id === opt.id);

            let stateClasses = "border-[var(--color-border)]";
            if (isCorrectOption) stateClasses = "border-brand-green bg-brand-green-light";
            else if (isWrongSelected) stateClasses = "border-brand-red bg-brand-red-light";
            else if (isSelected) stateClasses = "border-brand-blue";

            if (!result) {
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(opt)}
                  disabled={submitting}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition disabled:opacity-70 ${stateClasses}`}
                >
                  {/* Phase 2A: circular letter badge, filled once selected —
                      matches Qbank12.png's option treatment. */}
                  {/* Not aria-hidden — the letter is real, load-bearing
                      content (which option this is), not decoration; a
                      screen reader must still hear "A" before the option
                      text, exactly as the plain "A)" text did before. */}
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
            }

            return (
              <div key={opt.id} className={`rounded-xl border px-4 py-3.5 text-sm transition ${stateClasses}`}>
                <OptionResultBar
                  letter={letterFor(i)}
                  option={opt}
                  state={isCorrectOption ? "correct" : isWrongSelected ? "wrong-selected" : "neutral"}
                  percentage={optResult?.pick_percentage}
                  showStats={result.stats_available}
                />
              </div>
            );
          })}
        </div>

        {submitError && !result && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand-red bg-brand-red-light px-4 py-3">
            <p className="text-sm font-semibold text-brand-red">Your answer wasn&apos;t saved. Check your connection and try again.</p>
            <button
              type="button"
              onClick={retrySubmit}
              disabled={submitting}
              className="flex-none rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Retrying…" : "Submit Again"}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Phase 2B: explicit "Your Answer" vs "Correct Answer" restated
                as colored banner cards with icon + label — not color-only —
                matching Qbank12.png's explanation panel. The full option
                list above still carries per-option peer statistics, which
                this summary doesn't duplicate. */}
            <div className="flex flex-col gap-2.5">
              {!result.is_correct && selectedOpt && (
                <div className="flex items-center gap-3 rounded-2xl bg-brand-red-light p-4">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-red text-base font-bold text-white"
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-red">Your Answer</p>
                    <div className="flex items-start gap-1.5 text-sm font-bold text-[var(--color-text)]">
                      <span className="flex-none">{letterFor(selectedIdx)}.</span>
                      <RichContent html={selectedOpt.text} latex={selectedOpt.latex} className="min-w-0" />
                    </div>
                  </div>
                </div>
              )}
              {correctOpt && (
                <div className="flex items-center gap-3 rounded-2xl bg-brand-green-light p-4">
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-green text-base font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-green">Correct Answer</p>
                    <div className="flex items-start gap-1.5 text-sm font-bold text-[var(--color-text)]">
                      <span className="flex-none">{letterFor(correctIdx)}.</span>
                      <RichContent html={correctOpt.text} latex={correctOpt.latex} className="min-w-0" />
                    </div>
                  </div>
                </div>
              )}
              <PerformanceMessage
                statsAvailable={result.stats_available}
                correctPercent={result.students_correct_percent}
                totalResponses={result.total_responses}
              />
            </div>

            {/* Phase 2C: explanation, restructured into "why correct" / "why
                others wrong" sections instead of one undifferentiated block. */}
            <div className="rounded-xl bg-[var(--color-surface-muted)] p-4">
              {result.explanation || result.explanation_latex || result.explanation_image || result.explanation_video_url ? (
                <>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Why this is correct</p>
                  <RichContent
                    html={result.explanation}
                    latex={result.explanation_latex}
                    image={result.explanation_image}
                    imageData={result.explanation_image_data}
                    video={result.explanation_video_url}
                    className="text-sm leading-relaxed text-[var(--color-text-muted)]"
                  />
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Explanation not available yet.</p>
              )}

              {result.options?.some((o) => o.explanation) && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Why the other options are wrong
                  </p>
                  {(() => {
                    let badgeIndex = -1;
                    return question.options.map((opt, i) => {
                      const optResult = result.options.find((o) => o.id === opt.id);
                      if (!optResult?.explanation || opt.id === result.correct_option_id) return null;
                      badgeIndex += 1;
                      const badgeClass = WRONG_OPTION_BADGES[badgeIndex % WRONG_OPTION_BADGES.length];
                      return (
                        <div key={opt.id} className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-white p-3">
                          <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}>
                            {letterFor(i)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[var(--color-text)]">
                              <RichContent html={opt.text} latex={opt.latex} />
                            </div>
                            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{optResult.explanation}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">MCQ ID: {question.public_id}</p>
            </div>

            {/* Phase 2C: relabeled from "Exam Pearl" — the backing field is
                key_takeaway ("one high-yield exam point"), which is exactly
                a Key Takeaway. There is no separate Exam Pearl field, so no
                second, fabricated section is added for it. */}
            {result.key_takeaway && (
              <div className="rounded-xl border border-info/20 bg-info-soft p-4">
                <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-info">
                  <span aria-hidden="true">💡</span> Key Takeaway
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-text)]">{result.key_takeaway}</p>
              </div>
            )}

            {(result.reference_book_name || result.references?.length > 0) && (
              <div className="rounded-xl border border-[var(--color-border)] p-4">
                <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <span aria-hidden="true">📚</span> Reference
                </p>
                <ReferenceCard
                  bookName={result.reference_book_name}
                  edition={result.reference_edition}
                  chapter={result.reference_chapter}
                  page={result.reference_page}
                  url={result.reference_url}
                  className="!border-0 !p-0"
                />
                <ReferencesList references={result.references} className={result.reference_book_name ? "mt-3" : ""} />
              </div>
            )}

            {/* Phase 2D: confidence — same mechanism/endpoint as before,
                relabeled to match Qbank12.png's exact copy. QBank practice
                only; never shown in Test Mode (QuestionSolver isn't used
                there). */}
            <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3.5 py-2.5">
              <p className="flex-none text-xs font-semibold text-[var(--color-text-muted)]">How confident were you?</p>
              <div className="flex flex-wrap gap-1.5">
                {CONFIDENCE_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => submitConfidence(c.key)}
                    aria-pressed={confidence === c.key}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      confidence === c.key ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    <span aria-hidden="true">{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phase 2D: mastery + revision — both sourced from the same
                QuestionAttempt row record_question_result() already wrote;
                no second mastery system, no invented dates. */}
            {(masteryMeta || result.mastery_status === "new" || revisionLabel) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {masteryMeta ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${masteryMeta.className}`}>
                    <span aria-hidden="true">{masteryMeta.emoji}</span> {masteryMeta.label}
                  </span>
                ) : (
                  result.mastery_status === "new" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-bold text-[var(--color-text-muted)]">
                      <span aria-hidden="true">🆕</span> New
                    </span>
                  )
                )}
                {revisionLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-semibold text-[var(--color-text-muted)]">
                    <span aria-hidden="true">📅</span> {revisionLabel}
                  </span>
                )}
              </div>
            )}

            {/* Phase 2D: Question History — real QuestionEvent rows for this
                user+question, nothing synthesized. */}
            {result.recent_events?.length > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Your Question History
                </p>
                <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                  {result.attempts_count} attempt{result.attempts_count === 1 ? "" : "s"}
                </p>
                <div className="flex flex-col gap-1">
                  {result.recent_events.map((e, i) => (
                    <p key={i} className="text-xs text-[var(--color-text)]">
                      <span aria-hidden="true">{e.is_correct ? "✅" : "❌"}</span>{" "}
                      <span className="sr-only">{e.is_correct ? "Correct" : "Incorrect"} on </span>
                      {formatEventDate(e.date)}
                    </p>
                  ))}
                </div>
                {masteryMeta && (
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Current status: <span className="font-semibold text-[var(--color-text)]">{masteryMeta.label}</span>
                  </p>
                )}
              </div>
            )}

            {/* Phase 2E: Practice This Concept — reuses the existing
                Practice Session Builder, scoped to this question's own
                topic/chapter/subject (never a fabricated "similar"
                relationship). */}
            {similarHref && (
              <Link
                href={similarHref}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-blue px-4 py-2.5 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5"
              >
                Practice Similar Questions
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[44rem] items-center gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={isFirst}
            className="flex-none rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold text-[var(--color-text)] disabled:opacity-40"
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            onClick={goNext}
            disabled={!result}
            className="flex-1 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {isLast ? finishLabel : "Next"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
