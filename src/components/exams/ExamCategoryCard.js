"use client";

import Link from "next/link";
import { ChevronRightIcon } from "../icons";

/**
 * One premium exam-category card on the Exams hub (Mobile Exams Hub Visual
 * Redesign — reproduces the supplied "updated" reference screenshot's card
 * architecture: left visual panel + right title/description/badge/chips/
 * arrow). This is a pure presentation component — it receives everything
 * it renders as props and calls no API of its own, matching how this hub
 * page has always worked (a static category catalog; access lives on the
 * destination page, not here — see exams/page.js).
 *
 * Single-Viewport Update: internal spacing (panel padding, icon size, row
 * gaps, chip/badge padding, arrow size) now uses clamp() so every card
 * gets meaningfully more compact as the viewport narrows, in the fixed
 * order the task's compression priority calls for — title, description,
 * course-selector-equivalent content (here: the badge, since it carries
 * real per-category identity) are NOT shrunk; only spacing/decoration is.
 * The chips row and the arrow CTA were also merged onto one row (they
 * were two separate rows before) — a real structural compression, not
 * just tighter padding, worth roughly one row's height per card.
 *
 * The whole card is one <Link> (Step 17: avoid a nested link-inside-button
 * structure) with an explicit aria-label so a screen reader announces one
 * clean "Title — description" name on Tab/focus, rather than concatenating
 * every chip and the badge into a long link name. The left visual panel
 * (icon + panelLabel) and the trailing arrow are purely decorative/
 * redundant with that name, so both are aria-hidden (Step 37) — the badge
 * and feature chips stay real, non-hidden text, since they carry genuinely
 * distinct information the aria-label doesn't restate, and remain
 * reachable via a screen reader's normal swipe/scan navigation even though
 * they don't add to the link's announced name.
 */
export default function ExamCategoryCard({ href, Icon, title, description, badge, panelLabel, features }) {
  return (
    <Link
      href={href}
      aria-label={`${title} — ${description}`}
      className="group flex overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-marketing-bar)]"
    >
      {/* Left visual panel — dark-teal family (the same --color-exam-card/
          -deep tokens already used for exam-card surfaces elsewhere) so it
          reads as part of the app, not an invented color. Narrowed from an
          earlier ~30%/124px to ~26%/108px — real-browser measurement (see
          the deployment report) showed the title row needed the extra
          width more than the panel needed the extra size at this range. */}
      <div
        aria-hidden="true"
        className="flex w-[24%] max-w-[100px] flex-none flex-col items-center justify-between gap-1 px-1 py-[clamp(0.375rem,3vw,1rem)] text-center text-white sm:max-w-[126px]"
        style={{ background: "linear-gradient(160deg, var(--color-exam-card) 0%, var(--color-exam-card-deep) 100%)" }}
      >
        <span className="flex h-[clamp(2.25rem,9vw,3.5rem)] w-[clamp(2.25rem,9vw,3.5rem)] flex-1 items-center justify-center rounded-full bg-white/15">
          <Icon className="h-[clamp(1.125rem,4.5vw,1.75rem)] w-[clamp(1.125rem,4.5vw,1.75rem)]" />
        </span>
        <p className="text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white/90 sm:text-[11px]">
          {panelLabel}
        </p>
      </div>

      {/* Right content — 3 compact rows: title+badge, description, chips+arrow. */}
      <div className="flex min-w-0 flex-1 flex-col gap-[clamp(0.125rem,1.5vw,0.5rem)] px-[clamp(0.4rem,2.5vw,0.75rem)] py-[clamp(0.25rem,3vw,0.875rem)]">
        <div className="flex items-start justify-between gap-1.5">
          {/* clamp(), not a fixed text-base/sm:text-lg step: the badge's
              width barely shrinks as the viewport narrows, so it eats a
              proportionally bigger share of this row at 320-390px than at
              414-430px — a plain two-step responsive size still let "Past
              Year Questions" wrap to 2 lines at 390px in real-browser
              measurement. This scales continuously with the same effect,
              verified empirically (see report), not by formula alone. */}
          <h2 className="min-w-0 text-[clamp(0.8125rem,4vw,1.125rem)] font-extrabold leading-tight text-[var(--color-navy)]">{title}</h2>
          <span className="flex-none rounded-full bg-[var(--color-marketing-bar)]/10 px-1 py-0.5 text-[9px] font-bold text-[var(--color-marketing-bar)] sm:px-2 sm:text-[10px]">
            {badge}
          </span>
        </div>

        <p className="rounded-lg bg-[var(--color-surface-muted)] px-1.5 py-[clamp(0.125rem,1vw,0.375rem)] text-[clamp(0.625rem,2.8vw,0.75rem)] leading-snug text-[var(--color-text-muted)]">
          {description}
        </p>

        <div className="flex items-center justify-between gap-1.5">
          {/* Chip icons explicitly sized small — several of the reused
              nav/dashboard icon components default to 16-22px (sized for
              their normal contexts), which was oversized for a 9-10px
              chip pill and was the actual reason this row wrapped to two
              lines at 320-375px (found via real-browser row-height
              measurement, not assumed) — bigger contributor than any
              padding/gap number. */}
          <div className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5">
            {features.map(({ label, ChipIcon }) => (
              <span
                key={label}
                className="flex items-center gap-0.5 rounded-full bg-[var(--color-marketing-bar)]/10 px-1 py-[clamp(0.0625rem,1vw,0.125rem)] text-[8px] font-semibold leading-none text-[var(--color-marketing-bar)] sm:px-2 sm:text-[10px]"
              >
                <ChipIcon className="h-2 w-2 flex-none" />
                {label}
              </span>
            ))}
          </div>

          <span
            aria-hidden="true"
            className="flex h-[clamp(1.375rem,6vw,1.75rem)] w-[clamp(1.375rem,6vw,1.75rem)] flex-none items-center justify-center rounded-full text-white transition group-hover:translate-x-0.5"
            style={{ background: "linear-gradient(120deg, var(--color-marketing-bar) 0%, var(--color-exam-card) 100%)" }}
          >
            <ChevronRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
