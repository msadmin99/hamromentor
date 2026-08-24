"use client";

import { useEffect, useMemo, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import { api } from "@/lib/api";

const PRODUCT_TYPES = [
  { key: "qbank", label: "Question Bank", icon: "📘" },
  { key: "mock_test", label: "Mock Tests", icon: "📝" },
  { key: "daily_test", label: "Daily Tests", icon: "📅" },
  { key: "pyq", label: "Past Year Questions", icon: "📚" },
  { key: "video", label: "Video Course", icon: "🎥" },
];

function planLabel(p) {
  const detail = p.mock_test_quota != null ? `${p.mock_test_quota} tests` : `${p.duration_value} ${p.duration_unit}(s)`;
  return `${p.name} (${detail})`;
}

/** The "Build Your Own Combo" calculator — student toggles any subset of the
 * 5 product types, we debounce a live POST /combo-quote/ for the same
 * tier-discount math the server uses at actual purchase time (see
 * billing/views.py::_validate_and_price_combo), so preview and purchase
 * never disagree. Never treats a selection as time-based — it's just a set
 * of real SubscriptionPlan rows, priced exactly like buying them one by one. */
export default function BuildYourOwnCombo({ courseId }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setSelected({});
    api.get(`/subscription-plans/?course=${courseId}`).then(setPlans);
  }, [courseId]);

  const plansByType = useMemo(() => {
    const acc = {};
    plans.forEach((p) => {
      (acc[p.product_type] = acc[p.product_type] || []).push(p);
    });
    return acc;
  }, [plans]);

  const selectedPlanIds = Object.values(selected).filter(Boolean);
  const selectedPlans = plans.filter((p) => selectedPlanIds.includes(String(p.id)));
  const individualTotal = selectedPlans.reduce((sum, p) => sum + Number(p.price), 0);

  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (selectedPlanIds.length < 2) return;
    setQuoting(true);
    const timer = setTimeout(() => {
      api
        .post("/combo-quote/", { plan_ids: selectedPlanIds.map(Number) })
        .then(setQuote)
        .catch((err) => setQuoteError(err.message))
        .finally(() => setQuoting(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanIds.join(",")]);

  function toggleType(type) {
    setSelected((s) => {
      if (s[type]) {
        const next = { ...s };
        delete next[type];
        return next;
      }
      const first = plansByType[type]?.[0];
      return first ? { ...s, [type]: String(first.id) } : s;
    });
  }

  function pickPlan(type, planId) {
    setSelected((s) => ({ ...s, [type]: planId }));
  }

  const canCheckout = quote?.valid && selectedPlanIds.length >= 2;

  return (
    <section className="rounded-2xl border-2 border-dashed border-brand-blue/40 bg-brand-blue/[0.03] p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold text-[var(--color-text)]">🛠️ Build Your Own Combo</h2>
        <span className="rounded-md bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue">
          UP TO 35% OFF
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Pick exactly what you need — the discount grows automatically as you add more.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {PRODUCT_TYPES.map((t) => {
          const available = plansByType[t.key] || [];
          const isSelected = Boolean(selected[t.key]);
          return (
            <div
              key={t.key}
              className={`rounded-xl border p-3 transition ${
                isSelected ? "border-brand-blue bg-white shadow-sm" : "border-[var(--color-border)] bg-white/60"
              } ${available.length === 0 ? "opacity-50" : ""}`}
            >
              <label className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={available.length === 0}
                  onChange={() => toggleType(t.key)}
                />
                <span>{t.icon}</span>
                {t.label}
                {available.length === 0 && <span className="text-xs font-normal text-[var(--color-text-muted)]">(unavailable)</span>}
              </label>
              {isSelected && available.length > 1 && (
                <select
                  value={selected[t.key]}
                  onChange={(e) => pickPlan(t.key, e.target.value)}
                  className="hm-input mt-2 text-xs"
                >
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>{planLabel(p)}</option>
                  ))}
                </select>
              )}
              {isSelected && available.length === 1 && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{planLabel(available[0])} — Rs. {available[0].price}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {selectedPlanIds.length < 2 && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Select at least 2 products above to see your combo price.
          </p>
        )}
        {selectedPlanIds.length >= 2 && (
          <>
            <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
              <span>Individual total</span>
              <span className="line-through">Rs. {individualTotal}</span>
            </div>
            {quoting && <p className="mt-1 text-xs text-[var(--color-text-muted)]">Calculating…</p>}
            {quoteError && <p className="mt-1 text-xs font-medium text-brand-red">{quoteError}</p>}
            {quote?.valid && (
              <>
                <div className="mt-1 flex items-center justify-between text-sm text-brand-green">
                  <span>Combo discount</span>
                  <span>{quote.discount_percent}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm font-semibold text-brand-green">
                  <span>Amount saved</span>
                  <span>− Rs. {quote.you_save}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-lg font-extrabold text-[var(--color-text)]">
                  <span>Final price</span>
                  <span>Rs. {quote.final_price}</span>
                </div>
              </>
            )}
            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => setShowCheckout(true)}
              className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              Get This Combo
            </button>
          </>
        )}
      </div>

      {showCheckout && quote?.valid && (
        <CheckoutModal
          kind="combo"
          combo={{
            planIds: selectedPlanIds.map(Number),
            label: "Custom Combo",
            items: selectedPlans.map((p) => ({ name: p.name, price: p.price })),
            individualValue: quote.individual_value,
            discountPercent: quote.discount_percent,
            youSave: quote.you_save,
            finalPrice: quote.final_price,
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </section>
  );
}
