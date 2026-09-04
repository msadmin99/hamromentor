"use client";

// Shared by Area 4 (subscriptions/plans/checkout/invoice/promo-codes) — the
// same "distinguish a failed request from a genuinely empty list" pattern
// the brief requires everywhere in this area, defined once instead of
// copy-pasted into ~10 components.

export function ErrorCard({ title = "Unable to load your data.", subtitle = "Please try again.", onRetry }) {
  return (
    <div className="hm-card p-4">
      <p className="text-sm text-brand-red">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-xs font-bold text-brand-blue">
          Retry
        </button>
      )}
    </div>
  );
}
