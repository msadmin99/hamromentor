"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ErrorCard } from "@/components/subscription/billingShared";
import { PRODUCT_META } from "@/components/subscription/productIcons";

const PRODUCT_TABS = [
  { key: "qbank", label: PRODUCT_META.qbank.label, Icon: PRODUCT_META.qbank.Icon },
  { key: "daily_test", label: PRODUCT_META.daily_test.label, Icon: PRODUCT_META.daily_test.Icon },
  { key: "mock_test", label: PRODUCT_META.mock_test.label, Icon: PRODUCT_META.mock_test.Icon },
  { key: "video", label: PRODUCT_META.video.label, Icon: PRODUCT_META.video.Icon },
  { key: "pyq", label: PRODUCT_META.pyq.label, Icon: PRODUCT_META.pyq.Icon },
];

// Pass a changing `key` prop (e.g. key={initialProduct}) from the parent when
// initialProduct needs to force a fresh tab — remounting avoids syncing an
// effect into state just to mirror a prop.
export default function AvailablePlans({ courseId, initialProduct, onBuy }) {
  const [tab, setTab] = useState(initialProduct || "qbank");
  const [plans, setPlans] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [discounts, setDiscounts] = useState({});

  // A student with no active course (most commonly: brand new, never
  // enrolled in anything yet) previously made this whole section do
  // nothing at all — exactly the audience "Browse Plans" most needs to
  // work for. Falls back to a course picker fetching the full catalog,
  // same source /plans already uses, rather than requiring an active
  // course just to look at what's available.
  const [allCourses, setAllCourses] = useState([]);
  const [pickedCourseId, setPickedCourseId] = useState("");
  useEffect(() => {
    if (courseId || allCourses.length) return;
    api.get("/courses/").then((data) => {
      setAllCourses(data);
      if (data.length) setPickedCourseId(String(data[0].id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const effectiveCourseId = courseId || pickedCourseId;

  function load() {
    if (!effectiveCourseId) return;
    api
      .get(`/subscription-plans/?course=${effectiveCourseId}&product_type=${tab}`)
      .then((data) => {
        setPlans(data);
        setError(false);
        data.forEach((plan) => {
          api
            .post("/coupons/apply/", { code: "", kind: "subscription", plan_id: plan.id })
            .then((info) => {
              if (info.discount_amount > 0) {
                setDiscounts((d) => ({ ...d, [plan.id]: info }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    // Unlike the sibling /plans section components (which accept brief
    // staleness on a course switch to avoid this same lint finding), this
    // reset is kept: `tab` changes via a visible, immediate button click,
    // and without resetting, the just-clicked tab's active-highlight would
    // update instantly while the OLD tab's plan cards kept showing —
    // a visible product-name-vs-price mismatch, not just staleness.
    setPlans(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCourseId, tab]);

  return (
    <div className="hm-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">Available Plans</p>
        <div className="flex flex-wrap rounded-lg border border-[var(--color-border)] p-0.5">
          {PRODUCT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === t.key ? "bg-brand-blue text-white" : "text-[var(--color-text-muted)]"
              }`}
            >
              {t.Icon && <t.Icon className="h-3.5 w-3.5" />} {t.label}
            </button>
          ))}
        </div>
      </div>

      {!courseId && allCourses.length > 0 && (
        <select
          value={pickedCourseId}
          onChange={(e) => setPickedCourseId(e.target.value)}
          className="hm-input mt-3 sm:max-w-xs"
        >
          {allCourses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {error && (
        <div className="mt-4">
          <ErrorCard onRetry={load} />
        </div>
      )}

      {!error && plans === null && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[var(--color-border)] p-4">
              <div className="h-3.5 w-2/3 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-4 h-6 w-1/3 rounded bg-[var(--color-surface-muted)]" />
              <div className="mt-4 h-9 w-full rounded-xl bg-[var(--color-surface-muted)]" />
            </div>
          ))}
        </div>
      )}

      {!error && plans !== null && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const discount = discounts[p.id];
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-4 ${
                  p.is_best_value ? "border-brand-blue shadow-lg" : "border-[var(--color-border)]"
                }`}
              >
                {(p.is_popular || p.is_best_value) && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-brand-blue px-2.5 py-1 text-[10px] font-bold text-white">
                    {p.is_best_value ? "BEST VALUE" : "POPULAR"}
                  </span>
                )}
                <p className="font-bold text-[var(--color-text)]">{p.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {p.duration_value} {p.duration_unit}(s)
                  {p.mock_test_quota != null && ` · ${p.mock_test_quota} mock tests`}
                </p>
                <div className="mt-3">
                  {discount ? (
                    <>
                      <span className="text-xs text-[var(--color-text-muted)] line-through">Rs. {p.price}</span>
                      <p className="text-xl font-extrabold text-[var(--color-text)]">Rs. {discount.final_amount}</p>
                      <p className="text-[11px] font-semibold text-brand-green">
                        {Math.round((discount.discount_amount / p.price) * 100)}% off applied
                      </p>
                    </>
                  ) : (
                    <p className="text-xl font-extrabold text-[var(--color-text)]">Rs. {p.price}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onBuy(p)}
                  className="mt-3 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white"
                >
                  Buy Now
                </button>
              </div>
            );
          })}
          {plans.length === 0 && (
            <p className="col-span-full text-center text-sm text-[var(--color-text-muted)]">
              No {PRODUCT_TABS.find((t) => t.key === tab)?.label} plans available for this course yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
