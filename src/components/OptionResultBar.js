import RichContent from "./RichContent";

/** Letter + text + correctness badge + percentage bar for one MCQ option,
 * shown once a student has answered (Practice) or a test is submitted
 * (Test Mode result). Shared by QuestionSolver.js and the test result page
 * so the two surfaces render identically — this is presentational only,
 * the caller still owns the outer button/div and its border/bg state.
 *
 * The ✓/✕ correctness icon is independent of sample size (correctness is
 * always known) — only the percentage number + bar are gated by
 * `showStats`, so a freshly-added question still shows who was right
 * without ever showing a misleading distribution. */
export default function OptionResultBar({ letter, option, state, percentage, showStats }) {
  const badgeClass =
    state === "correct" ? "text-brand-green" : state === "wrong-selected" ? "text-brand-red" : "text-[var(--color-text-muted)]";
  const barClass = state === "correct" ? "bg-brand-green" : state === "wrong-selected" ? "bg-brand-red" : "bg-[var(--color-text-muted)]";
  const showIcon = state === "correct" || state === "wrong-selected";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5">
          <span className="flex-none font-semibold">{letter})</span>
          <RichContent html={option.text} latex={option.latex} image={option.image} imageData={option.image_data} className="min-w-0 flex-1" />
        </div>
        {(showIcon || (showStats && percentage != null)) && (
          <span className={`flex-none whitespace-nowrap text-xs font-bold ${badgeClass}`}>
            {state === "correct" ? "✓ " : state === "wrong-selected" ? "✕ " : ""}
            {showStats && percentage != null ? `${percentage}%` : ""}
          </span>
        )}
      </div>
      {showStats && percentage != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${percentage}%` }} />
        </div>
      )}
    </div>
  );
}
