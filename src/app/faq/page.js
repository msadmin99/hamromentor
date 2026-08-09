"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";

const FAQS = [
  {
    q: "How do I renew my subscription?",
    a: "Go to My Subscription and click \"Renew / Upgrade\" on the plan you want to extend, then pick a plan and complete checkout. Your access extends from your current expiry date, so renewing early never wastes remaining time.",
  },
  {
    q: "What does \"Auto-renew\" actually do?",
    a: "This platform doesn't charge you automatically — there's no stored payment instrument. Turning on auto-renew just makes our reminder emails more insistent as your expiry date approaches; you'll still need to check out manually to renew.",
  },
  {
    q: "How do coupon codes work?",
    a: "Enter a code in the Coupons section or at checkout and click Validate/Apply. If it's valid for your account and the plan you're buying, the discount is applied automatically before you submit payment.",
  },
  {
    q: "How is my payment verified?",
    a: "Payments are verified manually — after you submit a payment reference (bank transfer, eSewa, Khalti, Fonepay, or ConnectIPS transaction ID), our team confirms it and approves your purchase, usually within one business day. Your subscription activates as soon as it's approved.",
  },
  {
    q: "Can I upgrade to a different plan?",
    a: "Yes — buying a new plan for a product you already have access to extends/replaces your current access once the purchase is approved, the same way a renewal does.",
  },
  {
    q: "How do I get an invoice for my purchase?",
    a: "Every approved purchase has a \"View\" link (a printable invoice page) and an \"Email\" button in your Payment History that sends the same invoice details to your account email.",
  },
  {
    q: "What if my payment isn't approved?",
    a: "If a payment reference can't be verified, your purchase is marked Rejected with a note explaining why. Contact support with your payment proof and we'll help sort it out.",
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hm-card p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-[var(--color-text)]">{item.q}</span>
        <span className="flex-none text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.a}</p>}
    </div>
  );
}

function FaqContent() {
  return (
    <AppShell>
      <Header title="FAQs" showBack />
      <div className="hm-page-narrow flex flex-col gap-3">
        {FAQS.map((item) => (
          <FaqItem key={item.q} item={item} />
        ))}
      </div>
    </AppShell>
  );
}

export default function FaqPage() {
  return (
    <RequireAuth>
      <FaqContent />
    </RequireAuth>
  );
}
