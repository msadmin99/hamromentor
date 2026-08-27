"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const PRODUCT_TABS = [
  { key: "qbank", label: "Question Bank", icon: "📚" },
  { key: "daily_test", label: "Daily Test", icon: "📅" },
  { key: "mock_test", label: "Mock Test", icon: "🎁" },
  { key: "video", label: "Video Lectures", icon: "🎥" },
  { key: "pyq", label: "Past Year Questions", icon: "🗂" },
];

// Pass a changing `key` prop (e.g. key={initialProduct}) from the parent when
// initialProduct needs to force a fresh tab — remounting avoids syncing an
// effect into state just to mirror a prop.
export default function AvailablePlans({ courseId, initialProduct, onBuy }) {
  const [tab, setTab] = useState(initialProduct || "qbank");
  const [plans, setPlans] = useState([]);
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

  useEffect(() => {
    if (!effectiveCourseId) return;
    api.get(`/subscription-plans/?course=${effectiveCourseId}&product_type=${tab}`).then((data) => {
      setPlans(data);
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
    });
  }, [effectiveCourseId, tab]);

  return (
    <div className="hm-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">Available Plans</p>
        <div className="flex flex-wrap rounded-lg border border-[var(--color-border)] p-0.5">
          {PRODUCT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                tab === t.key ? "bg-brand-blue text-white" : "text-[var(--color-text-muted)]"
              }`}
            >
              {t.icon} {t.label}
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
                <span
                  className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                    p.is_best_value ? "bg-brand-blue" : "bg-amber-500"
                  }`}
                >
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
    </div>
  );
}
