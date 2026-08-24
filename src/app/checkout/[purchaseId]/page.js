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
  expired: "Payment window expired",
  cancelled: "Order cancelled",
};

const ALLOWED_SCREENSHOT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

function ItemLabel({ purchase }) {
  if (purchase.kind === "grand_test") return <span>{purchase.grand_test_title}</span>;
  if (purchase.kind === "teacher_course") return <span>{purchase.teacher_course_title}</span>;
  if (purchase.kind === "combo") {
    return <span>{purchase.combo_plan_name || `Custom Combo (${purchase.combo_items?.length || 0} items)`}</span>;
  }
  return <span>{purchase.plan_name}</span>;
}

function formatCountdown(seconds) {
  if (seconds <= 0) return "Expired";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    function tick() {
      setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

function CheckoutContent() {
  const { purchaseId } = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [hasPaidClicked, setHasPaidClicked] = useState(false);
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    api.get(`/purchases/${purchaseId}/`).then(setPurchase);
    api.get("/payment-methods/").then(setMethods);
  }

  useEffect(load, [purchaseId]);

  const remainingSeconds = useCountdown(purchase?.expires_at);
  const windowExpired = purchase?.status === "unpaid" && (purchase.is_expired || remainingSeconds === 0);

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const canSubmit = purchase && ["unpaid", "resubmission_requested"].includes(purchase.status) && !windowExpired;

  function pickScreenshot(file) {
    setFileError("");
    setScreenshot(null);
    if (!file) return;
    if (!ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
      setFileError("Only JPG, JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setFileError("Screenshot must be 5MB or smaller.");
      return;
    }
    setScreenshot(file);
  }

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

  async function cancelOrder() {
    if (!confirm("Cancel this order? You can start a new one anytime.")) return;
    setCancelling(true);
    try {
      await api.post(`/purchases/${purchaseId}/cancel/`, {});
      router.push("/subscriptions");
    } catch (err) {
      setError(err.message);
      setCancelling(false);
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
    const effectiveStatus = windowExpired ? "expired" : purchase.status;
    return (
      <AppShell>
        <Header title="Payment Status" showBack />
        <div className="hm-page-narrow flex flex-col gap-4 py-6">
          <div className="hm-card p-5 text-center">
            <p className="text-xs font-mono text-[var(--color-text-muted)]">{purchase.order_id}</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text)]">
              <ItemLabel purchase={purchase} />
            </p>
            <p className="mt-2 text-sm font-semibold text-brand-blue">
              {submitted ? "Submitted — we'll verify and activate your access." : STATUS_LABELS[effectiveStatus] || purchase.status}
            </p>
            {purchase.status === "rejected" && purchase.admin_note && (
              <p className="mt-2 text-xs text-brand-red">Reason: {purchase.admin_note}</p>
            )}
            {windowExpired && !submitted && (
              <button onClick={() => router.back()} className="mt-4 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white">
                Start a new order
              </button>
            )}
            <button onClick={() => router.push("/subscriptions")} className="mt-3 w-full rounded-xl border border-[var(--color-border)] py-3 text-sm font-bold text-[var(--color-text)]">
              Go to My Subscriptions
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header title="Pay via QR" showBack />
      <div className="hm-page-narrow flex flex-col gap-4 py-6">
        {purchase.status === "resubmission_requested" && purchase.admin_note && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold">Your proof needs a fix</p>
            <p className="mt-1 text-xs">{purchase.admin_note}</p>
          </div>
        )}

        <div className="hm-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-[var(--color-text-muted)]">Order {purchase.order_id}</span>
            {remainingSeconds !== null && (
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${remainingSeconds < 60 ? "bg-brand-red-light text-brand-red" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}>
                ⏱ {formatCountdown(remainingSeconds)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
            <ItemLabel purchase={purchase} />
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Amount payable ({purchase.currency})</span>
            <span className="text-2xl font-extrabold text-[var(--color-text)]">Rs. {purchase.final_amount}</span>
          </div>
        </div>

        {!hasPaidClicked ? (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Scan & Pay</p>
              <div className="flex flex-wrap gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-semibold sm:py-1.5 ${
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
              <div className="hm-card flex flex-col items-center gap-3 p-5 text-center">
                {selectedMethod.merchant_name && (
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">{selectedMethod.merchant_name}</p>
                )}
                {selectedMethod.qr_code_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedMethod.qr_code_image} alt={`${selectedMethod.name} QR code`} className="h-56 w-56 object-contain" />
                )}
                {selectedMethod.account_info && (
                  <p className="w-full rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                    {selectedMethod.account_info}
                  </p>
                )}
                {selectedMethod.instructions && (
                  <div className="w-full text-left text-xs text-[var(--color-text-muted)] whitespace-pre-line">
                    <p className="mb-1 font-semibold text-[var(--color-text)]">How to Pay</p>
                    {selectedMethod.instructions}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setHasPaidClicked(true)}
                  className="mt-2 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white"
                >
                  I Have Paid
                </button>
              </div>
            )}

            <button onClick={cancelOrder} disabled={cancelling} className="text-center text-xs font-semibold text-[var(--color-text-muted)]">
              {cancelling ? "Cancelling…" : "Cancel this order"}
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="hm-card flex flex-col gap-3 p-4">
            <button type="button" onClick={() => setHasPaidClicked(false)} className="self-start text-xs font-semibold text-brand-blue">
              ← Back to QR
            </button>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                Transaction Reference / Transaction ID
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
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => pickScreenshot(e.target.files?.[0] || null)}
                className="hm-input"
              />
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">JPG, PNG, or WebP — up to 5MB.</p>
              {fileError && <p className="mt-1 text-xs font-medium text-brand-red">{fileError}</p>}
            </div>
            <div className="rounded-lg bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center justify-between">
                <span>Order ID</span>
                <span className="font-mono">{purchase.order_id}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Paid amount</span>
                <span className="font-semibold text-[var(--color-text)]">Rs. {purchase.final_amount}</span>
              </div>
            </div>
            {error && <p className="text-xs font-medium text-brand-red">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !screenshot || !!fileError}
              className="rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Payment Proof"}
            </button>
          </form>
        )}
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
