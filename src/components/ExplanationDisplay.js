"use client";

import { useMemo } from "react";
import ReferenceCard from "./ReferenceCard";
import ReferencesList from "./ReferencesList";
import RichContent from "./RichContent";
import { formatExplanation } from "@/lib/explanationFormatter";

/** Small, uppercase section label — the same visual language this app
 * already uses for "Why the other options are wrong" / "Key Takeaway" /
 * "Reference" (Chip-adjacent styling already established in
 * QuestionSolver.js and the Test result pages), just applied consistently
 * across every section here instead of being hand-rolled per call site. */
function SectionLabel({ children }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{children}</p>;
}

/** A section after the first gets a hairline top rule + generous top
 * padding instead of a card wrapper — the "visual landmark, not another
 * box" rhythm the redesign calls for (a premium textbook's section breaks,
 * not a dashboard's stacked cards). */
function Section({ divider = true, children }) {
  return <section className={divider ? "border-t border-[var(--color-border)] pt-6" : ""}>{children}</section>;
}

/**
 * Shared explanation presentation surface for every exam/learning
 * surface that shows a question's explanation — QBank, Smart Practice
 * (via QuestionSolver), Daily/Mock/Grand/PYQ Test results, and Grand Test
 * Missed Review. One visual language regardless of caller (redesign
 * brief §3): each caller maps its own already-existing payload shape into
 * these props; this component never fetches, never knows which exam type
 * it's in, and never touches access control — a caller simply doesn't
 * render this component at all while solutions are locked.
 *
 * `explanation`/`explanationLatex`/`explanationImage`/`explanationImageData`/
 * `explanationVideoUrl`/`keyTakeaway`/`references`/`referenceBookName`+
 * friends are exactly the existing backend fields (academics/models.py,
 * QuestionResultSerializer et al.) — nothing new, nothing invented.
 *
 * `options`: the caller's own real option list, already carrying the
 * facts only the app itself knows — `[{ id, letter, text, latex, isCorrect,
 * explanation }]`. `explanation` here is the existing per-option
 * Option.explanation field when populated; when it isn't, this component
 * still shows a per-option "why wrong" row for any letter the free-text
 * `explanation` field itself broke out (redesign brief §14) — never
 * inventing option text, only reusing prose already written by staff.
 */
export default function ExplanationDisplay({
  explanation,
  explanationLatex,
  explanationImage,
  explanationImageData,
  explanationVideoUrl,
  keyTakeaway,
  referenceBookName,
  referenceEdition,
  referenceChapter,
  referencePage,
  referenceUrl,
  references,
  options,
  footer = null,
  className = "",
}) {
  // `options` legitimately gets a fresh array identity on most parent
  // re-renders (every caller here maps its own question/result object into
  // this shape inline) — memoizing on that identity wouldn't actually save
  // any real work, and formatExplanation's string parsing is cheap, so
  // this simply recomputes with the current props rather than fighting for
  // a stable dependency key.
  const formatted = useMemo(
    () => formatExplanation(explanation, (options || []).map((o) => ({ letter: o.letter, text: o.text }))),
    [explanation, options]
  );

  const wrongOptions = (options || []).filter((o) => !o.isCorrect);
  const optionRows = wrongOptions
    .map((o) => {
      const parsed = formatted.optionAnalysisByLetter?.[o.letter];
      const explanationHtml = o.explanation || parsed?.text;
      if (!explanationHtml) return null;
      return { option: o, explanationHtml, status: o.explanation ? null : parsed?.status };
    })
    .filter(Boolean);
  const hasOptionAnalysis = optionRows.length > 0 || !!formatted.optionAnalysisHtml;

  const hasMedia = !!(explanationLatex || explanationImage || explanationImageData || explanationVideoUrl);
  const hasConcept = !!formatted.concept;
  const hasBody = !!(formatted.body || hasMedia);
  const hasTakeaway = !!(keyTakeaway || formatted.takeaway);
  const hasReference = !!(referenceBookName || references?.length > 0);

  const hasAnyContent = hasConcept || hasBody || hasOptionAnalysis || hasTakeaway || hasReference;

  if (!hasAnyContent) {
    return (
      <div className={className}>
        <p className="text-sm text-[var(--color-text-muted)]">Explanation not available yet.</p>
        {footer}
      </div>
    );
  }

  let sectionIndex = 0;
  const nextDivider = () => sectionIndex++ > 0;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {hasConcept && (
        <Section divider={nextDivider()}>
          <SectionLabel>The Core Concept</SectionLabel>
          <RichContent html={formatted.concept} className="hm-explanation-copy" />
        </Section>
      )}

      {hasBody && (
        <Section divider={nextDivider()}>
          {/* Only labeled when it isn't the sole section — a plain,
              unlabeled explanation (redesign brief §6: "if it only
              contains Correct Answer + Explanation, render only those")
              needs no bureaucratic "Explanation" heading of its own. */}
          {hasConcept && <SectionLabel>Explanation</SectionLabel>}
          <RichContent
            html={formatted.body}
            latex={explanationLatex}
            image={explanationImage}
            imageData={explanationImageData}
            video={explanationVideoUrl}
            className="hm-explanation-copy"
          />
        </Section>
      )}

      {hasOptionAnalysis && (
        <Section divider={nextDivider()}>
          <SectionLabel>Why the Other Options Are Wrong</SectionLabel>
          <div className="flex flex-col divide-y divide-[var(--color-border)]">
            {optionRows.map(({ option, explanationHtml, status }) => (
              <div key={option.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline gap-2">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    {option.letter}
                  </span>
                  <RichContent html={option.text} latex={option.latex} className="text-sm font-semibold text-[var(--color-text)]" />
                </div>
                {status && <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-red">{status}</p>}
                <RichContent html={explanationHtml} className="hm-explanation-copy pl-7 text-[var(--color-text-muted)]" />
              </div>
            ))}
            {formatted.optionAnalysisHtml && (
              <div className="py-3 first:pt-0 last:pb-0">
                <RichContent html={formatted.optionAnalysisHtml} className="hm-explanation-copy text-[var(--color-text-muted)]" />
              </div>
            )}
          </div>
        </Section>
      )}

      {hasTakeaway && (
        <Section divider={nextDivider()}>
          <div className="rounded-xl border border-info/20 bg-info-soft p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-info">Exam Takeaway</p>
            {keyTakeaway ? (
              <p className="text-sm leading-relaxed text-[var(--color-text)]">{keyTakeaway}</p>
            ) : (
              <RichContent html={formatted.takeaway} className="hm-explanation-copy" />
            )}
          </div>
        </Section>
      )}

      {hasReference && (
        <Section divider={nextDivider()}>
          <ReferenceCard
            bookName={referenceBookName}
            edition={referenceEdition}
            chapter={referenceChapter}
            page={referencePage}
            url={referenceUrl}
          />
          <ReferencesList references={references} className={referenceBookName ? "mt-3" : ""} />
        </Section>
      )}

      {footer}
    </div>
  );
}
