"use client";

import { CheckCircleIcon, ClockIcon, WarningTriangleIcon } from "@/components/icons";

// Phase D, Area 4: the complete, real Purchase.STATUS_CHOICES (billing/
// models.py) — unpaid, pending, resubmission_requested, approved, rejected,
// expired, cancelled, refunded. PaymentHistoryTable and RecentActivity each
// previously hardcoded their own partial copy of this list (missing
// `refunded` in one, missing `expired`/`cancelled`/`refunded` in the other)
// — a purchase in one of the missing states fell through to a wrong badge
// (PaymentHistoryTable) or blank/undefined text (RecentActivity). Defined
// once here so every consumer (payment history, recent activity, checkout,
// invoice) reflects the same real state, never a stale or partial copy.
export const PURCHASE_STATUS_META = {
  unpaid: { label: "Awaiting Payment", badgeClassName: "bg-warning-soft text-amber-800", Icon: ClockIcon, iconClassName: "text-[var(--color-text-muted)]" },
  pending: { label: "Pending Verification", badgeClassName: "bg-warning-soft text-amber-800", Icon: ClockIcon, iconClassName: "text-amber-700" },
  resubmission_requested: { label: "Resubmit Proof", badgeClassName: "bg-warning-soft text-amber-800", Icon: WarningTriangleIcon, iconClassName: "text-amber-700" },
  approved: { label: "Paid", badgeClassName: "bg-brand-green-light text-brand-green", Icon: CheckCircleIcon, iconClassName: "text-brand-green" },
  rejected: { label: "Rejected", badgeClassName: "bg-brand-red-light text-brand-red", Icon: WarningTriangleIcon, iconClassName: "text-brand-red" },
  expired: { label: "Expired", badgeClassName: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]", Icon: ClockIcon, iconClassName: "text-[var(--color-text-muted)]" },
  cancelled: { label: "Cancelled", badgeClassName: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]", Icon: WarningTriangleIcon, iconClassName: "text-[var(--color-text-muted)]" },
  refunded: { label: "Refunded", badgeClassName: "bg-info-soft text-info", Icon: CheckCircleIcon, iconClassName: "text-info" },
};

export function statusMeta(status) {
  return PURCHASE_STATUS_META[status] || PURCHASE_STATUS_META.unpaid;
}
