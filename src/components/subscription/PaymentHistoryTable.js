"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

const STATUS_STYLES = {
  unpaid: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  approved: "bg-brand-green-light text-brand-green",
  rejected: "bg-brand-red-light text-brand-red",
  pending: "bg-yellow-100 text-yellow-800",
  resubmission_requested: "bg-amber-100 text-amber-800",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
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
    <div className="hm-card overflow-x-auto p-4">
      <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Payment History</p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-[var(--color-text-muted)]">
          <tr>
            <th className="px-2 py-2">Invoice #</th>
            <th className="px-2 py-2">Item</th>
            <th className="px-2 py-2">Amount</th>
            <th className="px-2 py-2">Date</th>
            <th className="px-2 py-2">Method</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {purchases.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">#{p.id}</td>
              <td className="px-2 py-2.5 text-[var(--color-text)]">{p.kind === "grand_test" ? p.grand_test_title : p.plan_name}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text)]">Rs. {p.final_amount}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text-muted)]">{formatDate(p.created_at)}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[var(--color-text-muted)]">
                {p.payment_method_detail?.name || "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5">
                <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[p.status]}`}>
                  {p.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-right">
                {p.status === "approved" && (
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/invoice/${p.id}`} className="text-xs font-bold text-brand-blue">
                      View
                    </Link>
                    <button
                      onClick={() => emailInvoice(p.id)}
                      disabled={emailingId === p.id}
                      className="text-xs font-bold text-brand-blue disabled:opacity-60"
                    >
                      {emailingId === p.id ? "Sending…" : emailedId === p.id ? "Sent ✓" : "Email"}
                    </button>
                  </div>
                )}
                {p.status === "unpaid" && (
                  <Link href={`/checkout/${p.id}`} className="text-xs font-bold text-brand-blue">
                    Complete Payment
                  </Link>
                )}
                {p.status === "resubmission_requested" && (
                  <Link href={`/checkout/${p.id}`} className="text-xs font-bold text-amber-700" title={p.admin_note}>
                    Resubmit proof
                  </Link>
                )}
              </td>
            </tr>
          ))}
          {purchases.length === 0 && (
            <tr>
              <td colSpan={7} className="px-2 py-6 text-center text-[var(--color-text-muted)]">
                No purchases yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
