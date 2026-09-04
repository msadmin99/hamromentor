"use client";

import { useDialogA11y } from "@/lib/useDialogA11y";

// Bottom-sheet on mobile, centered dialog on desktop — extracted from
// ReportQuestionModal.js's existing responsive shell (items-end + rounded-t-2xl
// on mobile, sm:items-center + sm:rounded-2xl + sm:max-w-* on desktop) so the
// Test Player's mobile question navigator and Review Answers screen reuse one
// shell instead of duplicating it.
//
// Accessibility pass: previously this announced itself correctly
// (role/aria-modal/aria-label) but behaved like a plain overlay — Escape did
// nothing, Tab walked out into the page behind it, focus never entered on
// open and never returned to the trigger on close. Those behaviours now come
// from lib/useDialogA11y.js, shared with the modals that don't use this
// shell.
export default function Drawer({ open, onClose, title, children, maxWidth = "sm:max-w-sm", footer }) {
  const panelRef = useDialogA11y(open, onClose);

  if (!open) return null;

  return (
    /* The backdrop is presentation: it carries the dimming and the
       click-to-dismiss convenience, but not the dialog semantics. Those
       moved to the panel below — role="dialog"/aria-modal previously sat
       out here, which made the backdrop itself part of the dialog's
       accessible content.

       role="presentation", not aria-hidden: aria-hidden here would hide
       every descendant from assistive technology, including the dialog
       panel nested inside it. Escape is the keyboard equivalent of this
       click, so the backdrop needs no key handler and stays correctly out
       of the tab order. */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:max-h-[85dvh] sm:rounded-2xl ${maxWidth}`}
      >
        {title && (
          <div className="flex flex-none items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
            <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--color-text-muted)]">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex-none border-t border-[var(--color-border)] p-4">{footer}</div>}
      </div>
    </div>
  );
}
