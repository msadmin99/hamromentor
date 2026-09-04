"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { statusMeta } from "@/components/subscription/statusMeta";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function itemLabel(p) {
  if (p.kind === "grand_test") return p.grand_test_title;
  if (p.kind === "teacher_course") return p.teacher_course_title;
  return p.plan_name;
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${meta.badgeClassName}`}>
      <meta.Icon className={`h-3 w-3 ${meta.iconClassName}`} />
      {meta.label.toUpperCase()}
    </span>
  );
}

function PaymentActions({ purchase, emailingId, emailedId, onEmail }) {
  if (purchase.status === "approved" || purchase.status === "refunded") {
    return (
      <div className="flex items-center gap-3">
        <Link href={`/invoice/${purchase.id}`} className="text-xs font-bold text-brand-blue">
          View
        </Link>
        {purchase.status === "approved" && (
          <button
            type="button"
            onClick={() => onEmail(purchase.id)}
            disabled={emailingId === purchase.id}
            className="text-xs font-bold text-brand-blue disabled:opacity-60"
          >
            {emailingId === purchase.id ? "Sending…" : emailedId === purchase.id ? "Sent ✓" : "Email"}
          </button>
        )}
      </div>
    );
  }
  if (purchase.status === "unpaid" && !purchase.is_expired) {
    return (
      <Link href={`/checkout/${purchase.id}`} className="text-xs font-bold text-brand-blue">
        Complete Payment
      </Link>
    );
  }
  if (purchase.status === "resubmission_requested") {
    return (
      <Link href={`/checkout/${purchase.id}`} className="text-xs font-bold text-amber-700" title={purchase.admin_note}>
        Resubmit proof
      </Link>
    );
  }
  return null;
}

export default function PaymentHistoryTable({ purchases }) {
  const [emailingId, setEmailingId] = useState(null);
  const [emailedId, setEmailedId] = useState(null);

  async function emailInvoice(id) {
    setEmailingId(id);
    try {
      await api.post(`/purchases/${id}/email-invoice/`, {});
      setEmailedId(id);
    } finally {
      setEmailingId(null);
    }
  }

  return (
    <div className="hm-card p-4">
      <p className="mb-3 text-sm font-bold text-[var(--color-text)]">My Payments</p>

      {purchases.length === 0 && <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No payments yet.</p>}

      {purchases.length > 0 && (
        <>
          {/* Mobile: cards, not a squeezed table — same fields as the desktop table. */}
          <div className="flex flex-col gap-2.5 sm:hidden">
            {purchases.map((p) => (
              <div key={p.id} className="rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{itemLabel(p)}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">{p.order_id}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">{formatDate(p.created_at)}</span>
                  <span className="text-sm font-bold text-[var(--color-text)]">Rs. {p.final_amount}</span>
                </div>
                {p.status === "rejected" && p.admin_note && <p className="mt-1 text-[11px] text-brand-red">{p.admin_note}</p>}
                <div className="mt-2 border-t border-[var(--color-border)] pt-2">
                  <PaymentActions purchase={p} emailingId={emailingId} emailedId={emailedId} onEmail={emailInvoice} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table. */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-2 py-2">Order ID</th>
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Method</th>
                  <th className="px-2 py-2">Reference</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">{p.order_id}</td>
                    <td className="px-2 py-2.5 text-[var(--color-text)]">{itemLabel(p)}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text)]">Rs. {p.final_amount}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text-muted)]">
                      {p.payment_method_detail?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">
                      {p.payment_reference || "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text-muted)]">{formatDate(p.created_at)}</td>
                    <td className="whitespace-nowrap px-2 py-2.5">
                      <StatusBadge status={p.status} />
                      {p.status === "rejected" && p.admin_note && (
                        <p className="mt-1 max-w-[180px] text-[10px] text-brand-red">{p.admin_note}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right">
                      <div className="flex items-center justify-end">
                        <PaymentActions purchase={p} emailingId={emailingId} emailedId={emailedId} onEmail={emailInvoice} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
