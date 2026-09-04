"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { ErrorCard } from "@/components/subscription/billingShared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const DISCOUNT_LABELS = {
  percentage: (c) => `${c.discount_value}% off`,
  fixed: (c) => `Rs. ${c.discount_value} off`,
  free_exam: () => "Free Exam",
  free_subscription: () => "Free Subscription",
  free_grand_test: () => "Free Grand Test",
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function CouponCard({ coupon }) {
  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-base font-bold text-[var(--color-text)]">{coupon.code}</p>
        <span className="rounded-md bg-brand-green-light px-2 py-1 text-[10px] font-bold text-brand-green">
          {(DISCOUNT_LABELS[coupon.discount_type] || (() => coupon.discount_type))(coupon)}
        </span>
      </div>
      {coupon.name && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{coupon.name}</p>}
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        {coupon.course_name || "All courses"}
        {coupon.expiry_date && ` · Expires ${formatDate(coupon.expiry_date)}`}
      </p>
    </div>
  );
}

function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
}

function PromoCodesContent() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    api
      .get("/coupons/mine/")
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(load, []);

  async function shareReferral() {
    const text = `Use my Dr. Gutka referral code ${user.referral_code} to get a discount on your first purchase!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Dr. Gutka", text });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard
      }
    }
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell>
      <Header title="Promo Codes" showBack />
      <div className="hm-page-narrow flex flex-col gap-5">
        <section className="hm-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Your referral code</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-2xl font-bold text-brand-blue">{user?.referral_code || "—"}</p>
            <button onClick={shareReferral} className="hm-btn-primary px-4 py-2 text-xs">
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Share this code — your friend gets a discount on their first purchase, and you earn wallet credit once it&apos;s approved.
          </p>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-surface-muted)] px-3 py-2">
            <span className="text-xs font-semibold text-[var(--color-text)]">Wallet balance</span>
            <span className="text-sm font-bold text-brand-green">Rs. {user?.wallet_balance ?? "0.00"}</span>
          </div>
        </section>

        {error && <ErrorCard title="Unable to load your promo codes." onRetry={load} />}

        {!error && !data && (
          <div className="flex flex-col gap-3">
            <div className="h-16 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" />
            <div className="h-16 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" />
          </div>
        )}

        {!error && data && (
          <>
            <section className="hm-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Total savings</p>
              <p className="mt-1 text-2xl font-bold text-brand-green">Rs. {data.total_savings}</p>
            </section>

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Available promo codes</p>
              <div className="flex flex-col gap-2">
                {data.available.map((c) => (
                  <CouponCard key={c.id} coupon={c} />
                ))}
                {data.available.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)]">No promo codes available right now.</p>
                )}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Used promo codes</p>
              <div className="flex flex-col gap-2">
                {data.used.map((u) => (
                  <div key={u.id} className="hm-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-mono text-sm font-bold text-[var(--color-text)]">{u.coupon_code}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {u.item} · {formatDate(u.used_at)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-brand-green">-Rs. {u.savings}</span>
                  </div>
                ))}
                {data.used.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No promo codes redeemed yet.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function PromoCodesPage() {
  return (
    <RequireAuth>
      <PromoCodesContent />
    </RequireAuth>
  );
}
