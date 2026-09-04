"use client";

import { useEffect, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import { CheckCircleIcon, TrophyIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { ErrorCard } from "@/components/subscription/billingShared";

const PRODUCT_TYPE_LABELS = {
  qbank: "QBank",
  daily_test: "Daily Test",
  mock_test: "Mock Test",
  video: "Video",
  pyq: "PYQ",
};

function toCheckoutCombo(combo) {
  return {
    comboPlanId: combo.id,
    label: combo.name,
    items: (combo.plan_details || []).map((p) => ({ name: p.name, price: p.price })),
    individualValue: combo.individual_value,
    discountPercent: combo.discount_percent,
    youSave: combo.you_save,
    finalPrice: combo.final_price,
  };
}

/** Admin-curated bundles (Combo Plans) — the main-focus section on /plans,
 * shown ahead of every single-product section. A combo is just a discounted
 * package of real SubscriptionPlan prices (never hardcoded) — see
 * ComboPlanSerializer for the live individual_value/you_save/final_price
 * computation. */
export default function ComboPlansSection({ courseId }) {
  const [combos, setCombos] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [checkoutCombo, setCheckoutCombo] = useState(null);

  function load() {
    if (!courseId) return;
    api
      .get(`/combo-plans/?course=${courseId}`)
      .then((data) => {
        setCombos(data);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    // No synchronous reset before the fetch — see AvailablePlans.js's load()
    // for why (avoids react-hooks/set-state-in-effect without a real
    // behavior change; a course switch briefly shows the previous course's
    // combos until the new ones resolve, same as before this pass).
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Loading is invisible here (no skeleton) — this section self-hides on a
  // genuinely empty catalog too (`combos.length === 0` below), so a brief
  // loading flash would look identical to "no combos configured" either
  // way; a real failure still gets its own visible ErrorCard.
  if (!error && (combos === null || combos.length === 0)) return null;

  if (error) {
    return (
      <section>
        <ErrorCard title="Unable to load combo plans." onRetry={load} />
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-extrabold text-[var(--color-text)]">Combo Plans</h2>
        <span className="rounded-md bg-brand-green-light px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-green">
          SAVE MORE
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Bundle everything you need into one discounted package — the more you combine, the more you save.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {combos.map((combo) => {
          const flagship = combo.is_best_value;
          const badgeText = combo.is_best_value ? "BEST VALUE" : combo.is_popular ? "MOST POPULAR" : null;

          return (
            <div
              key={combo.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 transition ${
                flagship
                  ? "border-2 border-brand-blue shadow-xl sm:col-span-2 lg:col-span-2 lg:scale-[1.03]"
                  : "border-[var(--color-border)] shadow-sm"
              }`}
            >
              {badgeText && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-brand-blue px-3 py-1 text-[10px] font-bold text-white shadow">
                  {flagship && <TrophyIcon className="h-3 w-3" />} {badgeText}
                </span>
              )}

              <p className="mt-1 text-base font-extrabold text-[var(--color-text)]">{combo.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(combo.plan_details || []).map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-muted)]"
                  >
                    {PRODUCT_TYPE_LABELS[p.product_type] || p.product_type}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[var(--color-text)]">Rs. {combo.final_price}</span>
                <span className="text-sm text-[var(--color-text-muted)] line-through">Rs. {combo.individual_value}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-brand-green">
                You save Rs. {combo.you_save} ({combo.discount_percent}% off)
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {(combo.plan_details || []).map((p) => (
                  <li key={p.id} className="flex items-start gap-1.5 text-xs text-[var(--color-text)]">
                    <span className="mt-0.5 flex-none font-bold text-brand-green" aria-hidden="true">✓</span>
                    {p.name}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setCheckoutCombo(combo)}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:brightness-110 ${
                  flagship ? "bg-gradient-to-r from-brand-blue to-brand-blue/80" : "bg-brand-blue"
                }`}
              >
                Get Combo
              </button>
            </div>
          );
        })}
      </div>

      {checkoutCombo && (
        <CheckoutModal kind="combo" combo={toCheckoutCombo(checkoutCombo)} onClose={() => setCheckoutCombo(null)} />
      )}
    </section>
  );
}
