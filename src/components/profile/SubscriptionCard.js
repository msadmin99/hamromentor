"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WalletIcon } from "../icons";
import { api } from "@/lib/api";

/**
 * Profile redesign (Phase B) — reads the exact same `/my-subscriptions/`
 * endpoint and `is_current`/`expires_at`/`plan_name` fields that
 * subscriptions/page.js and performance/page.js already consume (see
 * performance/page.js's `activeSubscription` derivation) — no new backend
 * call, no invented field. State (active/expiring/expired/none) is derived
 * client-side from real data only; access itself is still decided entirely
 * server-side wherever it's enforced (billing.access) — this card only
 * describes what the server already returned.
 */
function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function daysRemaining(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATE_META = {
  active: { badge: "bg-brand-green-light text-brand-green", label: "ACTIVE" },
  expiring: { badge: "bg-warning-soft text-amber-700", label: "EXPIRING SOON" },
  expired: { badge: "bg-brand-red-light text-brand-red", label: "EXPIRED" },
  none: { badge: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]", label: "FREE" },
};

function load(setData) {
  api.get("/my-subscriptions/").then(setData).catch(() => setData(null));
}

export default function SubscriptionCard() {
  const [data, setData] = useState(undefined); // undefined = loading, null = error

  useEffect(() => load(setData), []);

  const iconBadge = (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
      <WalletIcon />
    </span>
  );

  if (data === undefined) {
    return (
      <section className="hm-card animate-pulse p-4 sm:p-5">
        <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-muted)]" />
        <div className="mt-3 h-5 w-32 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-3 w-48 rounded bg-[var(--color-surface-muted)]" />
      </section>
    );
  }

  if (data === null) {
    return (
      <section className="hm-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {iconBadge}
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Subscription</p>
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">Unable to load your subscription.</p>
        <button type="button" onClick={() => { setData(undefined); load(setData); }} className="mt-2 text-xs font-bold text-brand-blue">
          Try again
        </button>
      </section>
    );
  }

  const active = (data.subscriptions || []).find((s) => s.is_current);
  const hasAny = (data.subscriptions || []).length > 0;

  let state = "none";
  if (active) {
    const remaining = daysRemaining(active.expires_at);
    state = remaining != null && remaining <= 7 ? "expiring" : "active";
  } else if (hasAny) {
    state = "expired";
  }
  const meta = STATE_META[state];

  return (
    <section className="hm-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {iconBadge}
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Subscription</p>
        </div>
        <span className={`flex-none rounded-md px-2 py-1 text-[10px] font-bold ${meta.badge}`}>{meta.label}</span>
      </div>

      {state === "active" && (
        <>
          <p className="mt-3 text-base font-extrabold text-[var(--color-text)]">Premium access</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {active.plan_name ? `${active.plan_name} · ` : ""}
            {active.expires_at ? `Active until ${formatDate(active.expires_at)}` : "No expiry"}
          </p>
          <Link href="/subscriptions" className="mt-3 inline-block text-xs font-bold text-brand-blue">
            Manage Subscription →
          </Link>
        </>
      )}
      {state === "expiring" && (
        <>
          <p className="mt-3 text-base font-extrabold text-[var(--color-text)]">Expiring soon</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Your {active.plan_name || "plan"} ends {formatDate(active.expires_at)}.
          </p>
          <Link href="/subscriptions" className="mt-3 inline-block min-h-[40px] rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold leading-6 text-white">
            Renew →
          </Link>
        </>
      )}
      {state === "expired" && (
        <>
          <p className="mt-3 text-base font-extrabold text-[var(--color-text)]">Subscription expired</p>
          <p className="text-xs text-[var(--color-text-muted)]">Renew to restore premium access.</p>
          <Link href="/subscriptions" className="mt-3 inline-block min-h-[40px] rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold leading-6 text-white">
            Renew →
          </Link>
        </>
      )}
      {state === "none" && (
        <>
          <p className="mt-3 text-base font-extrabold text-[var(--color-text)]">Free account</p>
          <p className="text-xs text-[var(--color-text-muted)]">Unlock premium tests, resources and features.</p>
          <Link href="/plans" className="mt-3 inline-block min-h-[40px] rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold leading-6 text-white">
            View Plans →
          </Link>
        </>
      )}
    </section>
  );
}
