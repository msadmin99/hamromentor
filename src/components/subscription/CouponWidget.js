"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

function describeDiscount(coupon) {
  if (coupon.discount_type === "percentage") return `${coupon.discount_value}% off`;
  if (coupon.discount_type === "fixed") return `Rs. ${coupon.discount_value} off`;
  return "Free";
}

export default function CouponWidget() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function validate() {
    if (!code.trim()) return;
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const data = await api.get("/coupons/mine/");
      const match = (data.available || []).find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      if (!match) {
        setError("This code isn't valid, has expired, or doesn't apply to your account right now.");
      } else {
        setResult(match);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Coupons & Promo Codes</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Validate a code here before checkout — it&apos;ll be ready to apply when you buy or upgrade a plan.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="hm-input flex-1"
        />
        <button onClick={validate} disabled={checking} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold">
          {checking ? "…" : "Validate"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-brand-red">{error}</p>}
      {result && (
        <div className="mt-2 rounded-lg bg-brand-green-light p-3 text-xs text-brand-green">
          <p className="font-bold">Valid! {describeDiscount(result)}</p>
          {result.expiry_date && <p className="mt-0.5">Expires {new Date(result.expiry_date).toLocaleDateString()}</p>}
        </div>
      )}
      <Link href="/promo-codes" className="mt-3 inline-block text-xs font-bold text-brand-blue">
        View your referral code & savings →
      </Link>
    </div>
  );
}
