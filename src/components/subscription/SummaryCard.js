"use client";

import { productMeta } from "@/components/subscription/productIcons";

function formatDate(value) {
  if (!value) return "No expiry";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function daysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function validityPercent(startsAt, expiresAt) {
  if (!startsAt || !expiresAt) return 100;
  const start = new Date(startsAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  const pct = ((now - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export default function SummaryCard({ subscription, onToggleAutoRenew, togglingId, onUpgrade }) {
  const s = subscription;
  const remaining = daysRemaining(s.expires_at);
  const pct = validityPercent(s.starts_at, s.expires_at);
  const { label: productLabel, Icon: ProductIcon } = productMeta(s.product_type);

  return (
    <div className="hm-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {ProductIcon && <ProductIcon className="h-3.5 w-3.5" />}
            {productLabel}
          </p>
          <p className="mt-0.5 text-lg font-extrabold text-[var(--color-text)]">{s.plan_name || "Custom access"}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{s.course_name}</p>
        </div>
        <span
          className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
            s.is_current ? "bg-brand-green-light text-brand-green" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
          }`}
        >
          {s.is_current ? "ACTIVE" : "EXPIRED"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-[var(--color-text-muted)]">Started</p>
          <p className="font-semibold text-[var(--color-text)]">{formatDate(s.starts_at)}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-muted)]">Expires</p>
          <p className="font-semibold text-[var(--color-text)]">{formatDate(s.expires_at)}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-muted)]">Days remaining</p>
          <p className="font-semibold text-[var(--color-text)]">{remaining != null ? Math.max(remaining, 0) : "—"}</p>
        </div>
        {s.mock_test_quota != null && (
          <div>
            <p className="text-[var(--color-text-muted)]">Mock tests used</p>
            <p className="font-semibold text-[var(--color-text)]">
              {s.mock_test_used} / {s.mock_test_quota}
            </p>
          </div>
        )}
      </div>

      {s.expires_at && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
            <div
              className={`h-full rounded-full ${pct >= 90 ? "bg-brand-red" : pct >= 70 ? "bg-warning" : "bg-brand-blue"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{pct}% of validity period used</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text)]">
          <input
            type="checkbox"
            checked={s.auto_renew}
            disabled={togglingId === s.id}
            onChange={() => onToggleAutoRenew(s)}
          />
          Auto-renew reminders
        </label>
        <button onClick={() => onUpgrade(s.product_type)} className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white">
          Renew / Upgrade
        </button>
      </div>
    </div>
  );
}
