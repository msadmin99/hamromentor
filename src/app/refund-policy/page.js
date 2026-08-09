"use client";

import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";

function RefundPolicyContent() {
  return (
    <AppShell>
      <Header title="Refund Policy" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card border-2 border-dashed border-amber-400 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Placeholder — not final legal text</p>
          <p className="mt-1 text-xs text-amber-800">
            This page is a structural placeholder. Replace the sections below with your actual refund policy,
            reviewed by whoever handles legal/compliance for Dr. Gutka, before relying on this page.
          </p>
        </div>

        {[
          ["Requesting a refund", "Contact support with your purchase's invoice number and the reason for your request."],
          ["Eligibility window", "State the timeframe (e.g. within N days of purchase / before content is accessed) refund requests are considered in."],
          ["Non-refundable cases", "State which purchases are non-refundable (e.g. once a Grand Test password has been issued, once significant QBank/video content has been accessed)."],
          ["Processing", "State how long a refund takes to process and how it's returned (bank transfer, wallet credit, etc.)."],
        ].map(([title, body]) => (
          <div key={title} className="hm-card p-4">
            <p className="text-sm font-bold text-[var(--color-text)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{body}</p>
          </div>
        ))}

        <a href="mailto:atech1627@gmail.com" className="hm-card p-4 text-center text-sm font-bold text-brand-blue">
          Contact Support to request a refund →
        </a>
      </div>
    </AppShell>
  );
}

export default function RefundPolicyPage() {
  return (
    <RequireAuth>
      <RefundPolicyContent />
    </RequireAuth>
  );
}
