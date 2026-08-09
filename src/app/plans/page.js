"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CheckoutModal from "@/components/CheckoutModal";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

const PRODUCT_TABS = [
  { key: "qbank", label: "Question Bank", icon: "📚" },
  { key: "daily_test", label: "Daily Test", icon: "📅" },
  { key: "mock_test", label: "Mock Test", icon: "🎁" },
  { key: "video", label: "Video Lectures", icon: "🎥" },
];

function PlansContent() {
  const searchParams = useSearchParams();
  const requestedProduct = searchParams.get("product");
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [tab, setTab] = useState(
    PRODUCT_TABS.some((t) => t.key === requestedProduct) ? requestedProduct : "qbank",
  );
  const [plans, setPlans] = useState([]);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  useEffect(() => {
    api.get("/courses/").then((data) => {
      setCourses(data);
      if (data.length) setCourseId(String(data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    api.get(`/subscription-plans/?course=${courseId}&product_type=${tab}`).then(setPlans);
  }, [courseId, tab]);

  return (
    <AppShell>
      <Header title="Upgrade to Pro" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Free content stays free — subscribe to unlock everything else for your course.
        </p>

        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="hm-input">
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-[var(--color-border)] p-0.5">
          {PRODUCT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${
                tab === t.key ? "bg-brand-blue text-white" : "text-[var(--color-text-muted)]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {plans.map((p) => (
            <div key={p.id} className="hm-card p-4">
              <p className="font-bold text-[var(--color-text)]">{p.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {p.duration_value} {p.duration_unit}(s)
                {p.mock_test_quota != null && ` · ${p.mock_test_quota} mock tests`}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold text-[var(--color-text)]">Rs. {p.price}</span>
                <button onClick={() => setCheckoutPlan(p)} className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white">
                  Buy
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              No {PRODUCT_TABS.find((t) => t.key === tab)?.label} plans available yet for this course.
            </div>
          )}
        </div>
      </div>

      {checkoutPlan && <CheckoutModal kind="subscription" plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
    </AppShell>
  );
}

export default function PlansPage() {
  return (
    <RequireAuth>
      <PlansContent />
    </RequireAuth>
  );
}
