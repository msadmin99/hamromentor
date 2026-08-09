"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api, uploadFields } from "@/lib/api";

const STATUS_LABELS = {
  pending: "Submitted — awaiting verification",
  approved: "Approved — access granted",
  rejected: "Rejected",
};

function ItemLabel({ purchase }) {
  return <span>{purchase.kind === "grand_test" ? purchase.grand_test_title : purchase.plan_name}</span>;
}

function CheckoutContent() {
  const { purchaseId } = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function load() {
    api.get(`/purchases/${purchaseId}/`).then(setPurchase);
    api.get("/payment-methods/").then(setMethods);
  }

  useEffect(load, [purchaseId]);

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const canSubmit = purchase && ["unpaid", "resubmission_requested"].includes(purchase.status);

  async function submit(e) {
    e.preventDefault();
    if (!selectedMethodId) {
      setError("Please select a payment method.");
      return;
    }
    if (!screenshot) {
      setError("Please attach a screenshot of your payment.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await uploadFields(`/purchases/${purchaseId}/submit-payment/`, "POST", {
        payment_method: selectedMethodId,
        payment_reference: reference,
        payment_screenshot: screenshot,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!purchase) {
    return (
      <AppShell>
        <Header title="Complete Payment" showBack />
        <div className="hm-page py-10 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
      </AppShell>
    );
  }

  if (submitted || !canSubmit) {
    return (
      <AppShell>
        <Header title="Payment Status" showBack />
        <div className="hm-page-narrow flex flex-col gap-4 py-6">
          <div className="hm-card p-5 text-center">
            <p className="text-lg font-bold text-[var(--color-text)]">
              <ItemLabel purchase={purchase} />
            </p>
            <p className="mt-2 text-sm font-semibold text-brand-blue">
              {submitted
                ? "Submitted — we'll verify and activate your access."
                : STATUS_LABELS[purchase.status] || purchase.status}
            </p>
            {purchase.status === "rejected" && purchase.admin_note && (
              <p className="mt-2 text-xs text-brand-red">Reason: {purchase.admin_note}</p>
            )}
            <button onClick={() => router.push("/subscriptions")} className="mt-4 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white">
              Go to My Subscriptions
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title="Complete Payment" showBack />
      <div className="hm-page-narrow flex flex-col gap-4 py-6">
        {purchase.status === "resubmission_requested" && purchase.admin_note && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Your proof needs a fix</p>
            <p className="mt-1 text-xs">{purchase.admin_note}</p>
          </div>
        )}

        <div className="hm-card p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            <ItemLabel purchase={purchase} />
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Amount payable</span>
            <span className="text-xl font-extrabold text-[var(--color-text)]">Rs. {purchase.final_amount}</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Payment Methods</p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethodId(m.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  selectedMethodId === m.id
                    ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          {methods.length === 0 && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">No payment methods are configured yet — contact support.</p>
          )}
        </div>

        {selectedMethod && (
          <div className="hm-card flex flex-col items-center gap-3 p-4 text-center">
            {selectedMethod.qr_code_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedMethod.qr_code_image} alt={`${selectedMethod.name} QR code`} className="h-48 w-48 object-contain" />
            )}
            {selectedMethod.instructions && (
              <div className="w-full text-left text-xs text-[var(--color-text-muted)] whitespace-pre-line">
                <p className="mb-1 font-semibold text-[var(--color-text)]">How to Pay</p>
                {selectedMethod.instructions}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="hm-card flex flex-col gap-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              Payment reference (transaction ID)
            </label>
            <input
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="hm-input"
              placeholder="e.g. TXN-84921"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Payment screenshot</label>
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              className="hm-input"
            />
          </div>
          {error && <p className="text-xs font-medium text-brand-red">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit Payment Proof"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}
