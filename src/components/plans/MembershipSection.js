"use client";

import { useEffect, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import { api } from "@/lib/api";

const TIER_LABELS = ["BASIC", "STANDARD", "PREMIUM"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

/** Reused for both Practice Question Bank and Past Year Questions — both are
 * time-based MEMBERSHIP products (SubscriptionPlan rows with no
 * mock_test_quota, entitlement via Subscription.is_current/expires_at),
 * unlike Mock/Daily Test which are quota-based TEST_BUNDLE products handled
 * by TestBundleSection instead. Never rendered with the same card shape as
 * a test bundle — that's the whole point of splitting these components. */
export default function MembershipSection({ productType, heading, subtitle, features, courseId, subscriptions }) {
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState({});
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setDiscounts({});
    api.get(`/subscription-plans/?course=${courseId}&product_type=${productType}`).then((data) => {
      const membershipPlans = data.filter((p) => p.mock_test_quota == null);
      setPlans(membershipPlans);
      membershipPlans.forEach((plan) => {
        api
          .post("/coupons/apply/", { code: "", kind: "subscription", plan_id: plan.id })
          .then((info) => {
            if (info.discount_amount > 0) setDiscounts((d) => ({ ...d, [plan.id]: info }));
          })
          .catch(() => {});
      });
    });
  }, [courseId, productType]);

  const activeSub = (subscriptions || []).find((s) => s.product_type === productType && s.is_current);
  const useTierLabels = plans.length === 3;

  return (
    <section>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-extrabold text-[var(--color-text)]">{heading}</h3>
        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue">
          MEMBERSHIP
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>

      {activeSub && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-green-light px-4 py-3">
          <div>
            <p className="text-sm font-bold text-brand-green">Active — {activeSub.plan_name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Start: {formatDate(activeSub.starts_at)} · Expiry: {formatDate(activeSub.expires_at)}
            </p>
          </div>
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-brand-green">STATUS: ACTIVE</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan, i) => {
          const discount = discounts[plan.id];
          const finalPrice = discount ? discount.final_amount : plan.price;
          const badge = plan.is_best_value ? "BEST VALUE" : plan.is_popular ? "MOST POPULAR" : null;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 ${
                badge ? "border-brand-blue shadow-lg" : "border-[var(--color-border)]"
              }`}
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-blue px-3 py-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
              {useTierLabels && (
                <p className="text-[11px] font-bold tracking-wide text-[var(--color-text-muted)]">{TIER_LABELS[i]}</p>
              )}
              <p className="mt-1 text-base font-extrabold text-[var(--color-text)]">{plan.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {plan.duration_value} {plan.duration_unit}{plan.duration_value === 1 ? "" : "s"}
              </p>

              <div className="mt-3">
                <span className="text-2xl font-extrabold text-[var(--color-text)]">Rs. {finalPrice}</span>
                {discount && <span className="ml-2 text-sm text-[var(--color-text-muted)] line-through">Rs. {plan.price}</span>}
              </div>

              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {(features || []).map((f) => (
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
                {activeSub ? "Renew / Upgrade" : "Choose Plan"}
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            No {heading} plans available for this course yet.
          </p>
        )}
      </div>

      {checkoutPlan && (
        <CheckoutModal kind="subscription" plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </section>
  );
}
