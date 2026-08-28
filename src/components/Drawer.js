"use client";

// Bottom-sheet on mobile, centered dialog on desktop — extracted from
// ReportQuestionModal.js's existing responsive shell (items-end + rounded-t-2xl
// on mobile, sm:items-center + sm:rounded-2xl + sm:max-w-* on desktop) so the
// Test Player's mobile question navigator and Review Answers screen reuse one
// shell instead of duplicating it.
export default function Drawer({ open, onClose, title, children, maxWidth = "sm:max-w-sm", footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:max-h-[85dvh] sm:rounded-2xl ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex flex-none items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
            <h2 className="text-sm font-bold text-[var(--color-text)]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--color-text-muted)]">
              ✕
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex-none border-t border-[var(--color-border)] p-4">{footer}</div>}
      </div>
    </div>
  );
}
