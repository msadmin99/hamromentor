"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function InvoiceContent() {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/purchases/${purchaseId}/`)
      .then(setPurchase)
      .catch((e) => setError(e.message));
  }, [purchaseId]);

  if (error) {
    return (
      <AppShell showNav={false}>
        <Header title="Invoice" showBack />
        <p className="hm-page-narrow text-sm text-brand-red">{error}</p>
      </AppShell>
    );
  }

  if (!purchase) {
    return (
      <AppShell showNav={false}>
        <Header title="Invoice" showBack />
        <p className="hm-page-narrow text-sm text-[var(--color-text-muted)]">Loading…</p>
      </AppShell>
    );
  }

  const itemLabel =
    purchase.kind === "grand_test"
      ? purchase.grand_test_title
      : purchase.kind === "teacher_course"
        ? purchase.teacher_course_title
        : purchase.kind === "combo"
          ? purchase.combo_plan_name || "Custom Combo"
          : purchase.plan_name;

  return (
    <AppShell showNav={false}>
      <div className="print:hidden">
        <Header title="Invoice" showBack right={<button onClick={() => window.print()} className="text-xs font-bold text-white">🖨 Print</button>} />
      </div>

      <div className="hm-page-narrow print:mx-auto print:max-w-2xl">
        {purchase.status !== "approved" && (
          <p className="mb-4 rounded-lg bg-yellow-100 p-3 text-xs font-semibold text-yellow-800 print:hidden">
            This purchase is not yet approved — the invoice will finalize once payment is verified.
          </p>
        )}

        <div className="hm-card p-6 print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <p className="text-lg font-extrabold text-[var(--color-text)]">Dr. Gutka</p>
              <p className="text-xs text-[var(--color-text-muted)]">Invoice / Payment Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[var(--color-text)]">Invoice {purchase.order_id}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatDate(purchase.created_at)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-[var(--color-text-muted)]">Billed to</p>
              <p className="mt-1 text-[var(--color-text)]">{purchase.user_name}</p>
              <p className="text-[var(--color-text-muted)]">{purchase.user_email}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--color-text-muted)]">Status</p>
              <p
                className={`mt-1 font-bold ${
                  purchase.status === "approved"
                    ? "text-brand-green"
                    : purchase.status === "rejected"
                      ? "text-brand-red"
                      : "text-yellow-700"
                }`}
              >
                {purchase.status.toUpperCase()}
              </p>
              {purchase.decided_at && <p className="text-[var(--color-text-muted)]">{formatDate(purchase.decided_at)}</p>}
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.kind === "combo" ? (
                <>
                  {purchase.combo_plan_name && (
                    <tr className="border-b border-[var(--color-border)]">
                      <td colSpan={2} className="py-2 text-sm font-semibold text-[var(--color-text)]">{itemLabel}</td>
                    </tr>
                  )}
                  {(purchase.combo_items || []).map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)]">
                      <td className="py-2 pl-3 text-[var(--color-text-muted)]">{item.plan_name}</td>
                      <td className="py-2 text-right text-[var(--color-text)]">Rs. {item.price}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 text-[var(--color-text)]">{itemLabel}</td>
                  <td className="py-2 text-right text-[var(--color-text)]">Rs. {purchase.original_amount}</td>
                </tr>
              )}
              {Number(purchase.discount_amount) > 0 && (
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 text-[var(--color-text-muted)]">
                    Discount{purchase.coupon_code && ` (${purchase.coupon_code})`}
                  </td>
                  <td className="py-2 text-right text-brand-green">− Rs. {purchase.discount_amount}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 text-sm font-bold text-[var(--color-text)]">Total paid</td>
                <td className="py-2 text-right text-sm font-extrabold text-[var(--color-text)]">
                  Rs. {purchase.final_amount}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4 text-xs">
            <div>
              <p className="font-semibold text-[var(--color-text-muted)]">Payment reference</p>
              <p className="mt-1 text-[var(--color-text)]">{purchase.payment_reference || "—"}</p>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-[var(--color-text-muted)]">
            This is a system-generated receipt for a manually-verified payment. For questions, contact support.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-4 w-full rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white print:hidden"
        >
          🖨 Print / Save as PDF
        </button>
      </div>
    </AppShell>
  );
}

export default function InvoicePage() {
  return (
    <RequireAuth>
      <InvoiceContent />
    </RequireAuth>
  );
}
