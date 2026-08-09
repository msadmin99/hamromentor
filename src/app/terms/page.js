"use client";

import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";

function TermsContent() {
  return (
    <AppShell>
      <Header title="Terms & Conditions" showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card border-2 border-dashed border-amber-400 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Placeholder — not final legal text</p>
          <p className="mt-1 text-xs text-amber-800">
            This page is a structural placeholder. Replace the sections below with your actual Terms & Conditions,
            reviewed by whoever handles legal/compliance for Dr. Gutka, before relying on this page.
          </p>
        </div>

        {[
          ["1. Acceptance of Terms", "By creating an account and using Dr. Gutka, you agree to these Terms & Conditions."],
          ["2. Subscriptions & Access", "Subscription plans grant time-limited access to specific content (Question Bank, Daily Test, Mock Test, or Video Lectures) for the course selected at purchase."],
          ["3. Payments", "Payments are verified manually against the reference number you provide. Access activates once a payment is approved."],
          ["4. Account Use", "Accounts are for individual use and may be limited to a maximum number of active devices."],
          ["5. Content", "All questions, videos, and materials remain the property of Dr. Gutka and may not be redistributed."],
          ["6. Changes", "These terms may be updated from time to time; continued use after a change constitutes acceptance."],
        ].map(([title, body]) => (
          <div key={title} className="hm-card p-4">
            <p className="text-sm font-bold text-[var(--color-text)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{body}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default function TermsPage() {
  return (
    <RequireAuth>
      <TermsContent />
    </RequireAuth>
  );
}
