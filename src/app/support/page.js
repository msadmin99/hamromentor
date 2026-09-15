"use client";

import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { SupportContactCard } from "@/components/SupportContact";

function SupportContent() {
  return (
    <AppShell>
      <Header title="Help & Support" showBack />
      <div className="hm-page-narrow flex flex-col gap-5">
        <div className="hm-card p-4">
          <p className="text-lg font-bold text-[var(--color-text)]">Need Help?</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            We&apos;re here to help with your Dr. Gutka account, tests, subscriptions, payments and technical
            problems.
          </p>
        </div>

        <SupportContactCard />
      </div>
    </AppShell>
  );
}

export default function SupportPage() {
  return (
    <RequireAuth>
      <SupportContent />
    </RequireAuth>
  );
}
