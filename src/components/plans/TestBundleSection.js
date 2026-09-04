"use client";

import { useEffect, useMemo, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import { api } from "@/lib/api";
import { ErrorCard } from "@/components/subscription/billingShared";

/** Reused for Mock Test (usually several bundle sizes) and Daily Test
 * (usually one large bundle) — both are quota-based TEST_BUNDLE products
 * (SubscriptionPlan rows with mock_test_quota set), entitlement tracked as
 * Used/Remaining rather than a start/expiry date. Deliberately never shares
 * MembershipSection's card shape — a bundle is "N tests", not a duration. */
export default function TestBundleSection({ productType, heading, subtitle, courseId, subscriptions }) {
  const [plans, setPlans] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [discounts, setDiscounts] = useState({});
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  function load() {
    if (!courseId) return;
    api
      .get(`/subscription-plans/?course=${courseId}&product_type=${productType}`)
      .then((data) => {
        const bundlePlans = data.filter((p) => p.mock_test_quota != null).sort((a, b) => a.mock_test_quota - b.mock_test_quota);
        setPlans(bundlePlans);
        setError(false);
        bundlePlans.forEach((plan) => {
          api
            .post("/coupons/apply/", { code: "", kind: "subscription", plan_id: plan.id })
            .then((info) => {
              if (info.discount_amount > 0) setDiscounts((d) => ({ ...d, [plan.id]: info }));
            })
            .catch(() => {});
        });
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    // No synchronous reset before the fetch — see AvailablePlans.js's load()
    // for why. productType is fixed per call site on /plans (never changes
    // at runtime); only a course switch re-runs this.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, productType]);

  const activeBundles = useMemo(
    () => (subscriptions || []).filter((s) => s.product_type === productType && s.is_current && s.mock_test_quota != null),
    [subscriptions, productType],
  );
  const totalQuota = activeBundles.reduce((sum, s) => sum + s.mock_test_quota, 0);
  const totalUsed = activeBundles.reduce((sum, s) => sum + s.mock_test_used, 0);
  const largestQuota = plans?.length ? Math.max(...plans.map((p) => p.mock_test_quota)) : null;

  return (
    <section>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-extrabold text-[var(--color-text)]">{heading}</h3>
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
          TEST BUNDLE
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>

      {activeBundles.length > 0 && (
        <div className="mt-3 rounded-xl bg-brand-green-light px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-brand-green">{heading} — {totalQuota} Tests</p>
            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-brand-green">STATUS: ACTIVE</span>
          </div>
          <div className="mt-2 flex gap-5 text-xs text-[var(--color-text-muted)]">
            <span>Used: <strong className="text-[var(--color-text)]">{totalUsed}</strong></span>
            <span>Remaining: <strong className="text-[var(--color-text)]">{Math.max(totalQuota - totalUsed, 0)}</strong></span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <ErrorCard title={`Unable to load ${heading} bundles.`} onRetry={load} />
        </div>
      )}

      {!error && plans === null && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--color-border)] bg-white" />
          ))}
        </div>
      )}

      {!error && plans !== null && (
      <div className={`mt-4 grid grid-cols-1 gap-4 ${plans.length > 1 ? "sm:grid-cols-3" : ""}`}>
        {plans.map((plan) => {
          const discount = discounts[plan.id];
          const finalPrice = discount ? discount.final_amount : plan.price;
          const emphasized = plan.is_best_value || plan.is_popular || (largestQuota != null && plan.mock_test_quota === largestQuota && plans.length > 1);
          const badgeText = plan.is_best_value ? "BEST VALUE" : plan.is_popular ? "MOST POPULAR" : emphasized ? "BEST VALUE" : null;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 ${
                badgeText ? "border-brand-blue shadow-lg" : "border-[var(--color-border)]"
              }`}
            >
              {badgeText && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-blue px-3 py-1 text-[10px] font-bold text-white">
                  {badgeText}
                </span>
              )}
              <p className="text-xl font-extrabold text-[var(--color-text)]">{plan.mock_test_quota} Tests</p>
              <p className="text-xs text-[var(--color-text-muted)]">{plan.name}</p>

              <div className="mt-3">
                <span className="text-2xl font-extrabold text-[var(--color-text)]">Rs. {finalPrice}</span>
                {discount && <span className="ml-2 text-sm text-[var(--color-text-muted)] line-through">Rs. {plan.price}</span>}
              </div>

              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {/* Phase 10: the plan's own admin-configured features
                    (SubscriptionPlan.features, falling back server-side to a
                    line derived from its real duration/quota). The four
                    hardcoded arrays that used to live in plans/page.js could
                    drift from what a plan actually granted. */}
                {(plan.display_features || []).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--color-text)]">
                    <span className="mt-0.5 flex-none font-bold text-brand-green" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setCheckoutPlan(plan)}
                className="mt-4 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                Buy Now
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            No {heading} bundles available for this course yet.
          </p>
        )}
      </div>
      )}

      {checkoutPlan && (
        <CheckoutModal kind="subscription" plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </section>
  );
}
