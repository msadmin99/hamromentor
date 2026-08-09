"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const DISCOUNT_SOURCE_LABELS = {
  coupon: "Coupon applied",
  referral: "Referral discount applied",
};

export default function CheckoutModal({ kind, plan, grandTest, onClose, onSubmitted }) {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [priceInfo, setPriceInfo] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const baseAmount = kind === "subscription" ? plan.price : grandTest.price;
  const finalAmount = priceInfo?.valid ? priceInfo.final_amount : baseAmount;

  useEffect(() => {
    // Auto-quote with no typed code — surfaces an auto-apply promotion or a
    // referred student's friend discount before they've entered anything.
    api
      .post("/coupons/apply/", {
        code: "",
        kind,
        plan_id: kind === "subscription" ? plan.id : undefined,
        grand_test_id: kind === "grand_test" ? grandTest.id : undefined,
      })
      .then((data) => {
        if (data.discount_amount > 0) setPriceInfo(data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyCoupon() {
    if (!couponCode.trim()) {
      setPriceInfo(null);
      setCouponError("");
      return;
    }
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const data = await api.post("/coupons/apply/", {
        code: couponCode,
        kind,
        plan_id: kind === "subscription" ? plan.id : undefined,
        grand_test_id: kind === "grand_test" ? grandTest.id : undefined,
      });
      setPriceInfo(data);
    } catch (err) {
      setCouponError(err.message);
      setPriceInfo(null);
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const purchase = await api.post("/purchases/", {
        kind,
        plan_id: kind === "subscription" ? plan.id : undefined,
        grand_test_id: kind === "grand_test" ? grandTest.id : undefined,
        coupon_code: priceInfo?.valid && priceInfo.discount_source === "coupon" ? couponCode : "",
      });
      onSubmitted?.();
      router.push(`/checkout/${purchase.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="hm-card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-[var(--color-text)]">{kind === "subscription" ? plan.name : grandTest.title}</h2>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code (optional)"
            className="hm-input flex-1"
          />
          <button onClick={applyCoupon} disabled={checkingCoupon} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold">
            {checkingCoupon ? "…" : "Apply"}
          </button>
        </div>
        {couponError && <p className="mt-1 text-xs font-medium text-brand-red">{couponError}</p>}
        {priceInfo?.valid && priceInfo.discount_amount > 0 && (
          <p className="mt-1 text-xs font-semibold text-brand-green">
            {DISCOUNT_SOURCE_LABELS[priceInfo.discount_source] || "Discount applied"} — Rs. {priceInfo.discount_amount} off
          </p>
        )}

        <div className="mt-4 rounded-xl bg-[var(--color-surface-muted)] p-3 text-sm">
          {priceInfo?.valid && (
            <div className="flex items-center justify-between text-[var(--color-text-muted)]">
              <span>Price</span>
              <span className="line-through">Rs. {baseAmount}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-bold text-[var(--color-text)]">
            <span>Total</span>
            <span>Rs. {finalAmount}</span>
          </div>
        </div>

        {error && <p className="mt-2 text-xs font-medium text-brand-red">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-4 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Creating order…" : `Continue to Payment — Rs. ${finalAmount}`}
        </button>
        <button onClick={onClose} className="mt-2 w-full text-center text-xs font-semibold text-[var(--color-text-muted)]">
          Cancel
        </button>
      </div>
    </div>
  );
}
