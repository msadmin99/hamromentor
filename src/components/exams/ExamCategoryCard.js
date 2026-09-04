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
      {/* Left visual panel — ~27% of the card, dark-teal family (the same
          --color-exam-card/-deep tokens already used for exam-card surfaces
          elsewhere) so it reads as part of the app, not an invented color. */}
      <div
        aria-hidden="true"
        className="flex w-[30%] max-w-[124px] flex-none flex-col items-center justify-between gap-2 px-2 py-4 text-center text-white sm:max-w-[144px]"
        style={{ background: "linear-gradient(160deg, var(--color-exam-card) 0%, var(--color-exam-card-deep) 100%)" }}
      >
        <span className="flex h-14 w-14 flex-1 items-center justify-center rounded-full bg-white/15">
          <Icon className="h-7 w-7" />
        </span>
        <p className="text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white/90 sm:text-[11px]">
          {panelLabel}
        </p>
      </div>

      {/* Right content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-extrabold leading-tight text-[var(--color-navy)] sm:text-lg">{title}</h2>
          <span className="flex-none rounded-full bg-[var(--color-marketing-bar)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--color-marketing-bar)]">
            {badge}
          </span>
        </div>

        <p className="rounded-lg bg-[var(--color-surface-muted)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">
          {description}
        </p>

        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {features.map(({ label, ChipIcon }) => (
            <span
              key={label}
              className="flex items-center gap-1 rounded-full bg-[var(--color-marketing-bar)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--color-marketing-bar)]"
            >
              <ChipIcon />
              {label}
            </span>
          ))}
        </div>

        <span
          aria-hidden="true"
          className="mt-1 flex h-8 w-8 flex-none items-center justify-center self-end rounded-full text-white transition group-hover:translate-x-0.5"
          style={{ background: "linear-gradient(120deg, var(--color-marketing-bar) 0%, var(--color-exam-card) 100%)" }}
        >
          <ChevronRightIcon />
        </span>
      </div>
    </Link>
  );
}
