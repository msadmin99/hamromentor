"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { PrintIcon } from "@/components/icons";
import { ErrorCard } from "@/components/subscription/billingShared";
import { statusMeta } from "@/components/subscription/statusMeta";
import { api } from "@/lib/api";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function InvoiceContent() {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState(false);

  function load() {
    // No synchronous reset before the fetch (state only changes inside
    // .then()/.catch()) — keeps this reusable by both the mount effect and
    // Retry without tripping react-hooks/set-state-in-effect. The initial
    // `useState(null)` already covers the true first-mount loading state.
    api
      .get(`/purchases/${purchaseId}/`)
      .then((p) => {
        setPurchase(p);
        setError(false);
      })
      .catch(() => setError(true));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId]);

  if (error) {
    return (
      <AppShell showNav={false}>
        <Header title="Invoice" showBack />
        <div className="hm-page-narrow">
          <ErrorCard title="Unable to load this invoice." onRetry={load} />
        </div>
      </AppShell>
    );
  }

  if (!purchase) {
    return (
      <AppShell showNav={false}>
        <Header title="Invoice" showBack />
        <div className="hm-page-narrow">
          <div className="hm-card animate-pulse p-6">
            <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4">
              <div className="h-5 w-32 rounded bg-[var(--color-surface-muted)]" />
              <div className="h-5 w-24 rounded bg-[var(--color-surface-muted)]" />
            </div>
            <div className="mt-4 h-3 w-1/2 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-3 w-1/3 rounded bg-[var(--color-surface-muted)]" />
            <div className="mt-6 h-24 rounded bg-[var(--color-surface-muted)]" />
          </div>
        </div>
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

  const meta = statusMeta(purchase.status);

  return (
    <AppShell showNav={false}>
      <div className="print:hidden">
        <Header
          title="Invoice"
          showBack
          right={
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1 text-xs font-bold text-white">
              <PrintIcon className="h-4 w-4" /> Print
            </button>
          }
        />
      </div>

      <div className="hm-page-narrow print:mx-auto print:max-w-2xl">
        {purchase.status !== "approved" && purchase.status !== "refunded" && (
          <p className="mb-4 rounded-lg bg-warning-soft p-3 text-xs font-semibold text-amber-800 print:hidden">
            This purchase is not yet approved — the invoice will finalize once payment is verified.
          </p>
        )}
        {purchase.status === "refunded" && (
          <p className="mb-4 rounded-lg bg-info-soft p-3 text-xs font-semibold text-info print:hidden">
            This payment was refunded{purchase.refunded_at ? ` on ${formatDate(purchase.refunded_at)}` : ""}.
            {purchase.refund_reason && ` ${purchase.refund_reason}`}
          </p>
        )}

        <div className="hm-card p-6 print:border-0 print:shadow-none">
          <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
            <div>
              <p className="text-lg font-extrabold text-[var(--color-text)]">Dr. Gutka</p>
              <p className="text-xs text-[var(--color-text-muted)]">Invoice / Payment Receipt</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-[var(--color-text)]">Invoice {purchase.order_id}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatDate(purchase.created_at)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold text-[var(--color-text-muted)]">Billed to</p>
              <p className="mt-1 min-w-0 truncate text-[var(--color-text)]">{purchase.user_name}</p>
              <p className="min-w-0 truncate text-[var(--color-text-muted)]">{purchase.user_email}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-[var(--color-text-muted)]">Status</p>
              <p className={`mt-1 font-bold ${meta.iconClassName}`}>{meta.label.toUpperCase()}</p>
              {purchase.decided_at && <p className="text-[var(--color-text-muted)]">{formatDate(purchase.decided_at)}</p>}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
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
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--color-border)] pt-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold text-[var(--color-text-muted)]">Payment method</p>
              <p className="mt-1 text-[var(--color-text)]">{purchase.payment_method_detail?.name || "—"}</p>
            </div>
            <div className="sm:text-right">
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
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white print:hidden"
        >
          <PrintIcon className="h-4 w-4" /> Print / Save as PDF
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
