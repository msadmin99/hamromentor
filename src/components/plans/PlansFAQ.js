"use client";

import Link from "next/link";
import { useState } from "react";

// Same copy as /faq/page.js's FAQS array — a purchase-relevant subset, not
// new invented questions, so the two pages never contradict each other.
const FAQS = [
  {
    q: "How is my payment verified?",
    a: "Payments are verified manually — after you submit a payment reference (bank transfer, eSewa, Khalti, Fonepay, or ConnectIPS transaction ID), our team confirms it and approves your purchase, usually within one business day. Your access activates as soon as it's approved.",
  },
  {
    q: "How do coupon codes work?",
    a: "Enter a code at checkout and click Apply. If it's valid for your account and the item you're buying, the discount is applied automatically before you submit payment.",
  },
  {
    q: "Can I upgrade to a different plan later?",
    a: "Yes — buying a new plan for a product you already have access to extends/replaces your current access once the purchase is approved, the same way a renewal does.",
  },
  {
    q: "How do I get an invoice for my purchase?",
    a: "Every approved purchase has a printable invoice page, and an \"Email\" option in your Payment History that sends the same invoice details to your account email.",
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hm-card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-semibold text-[var(--color-text)]">{item.q}</span>
        <span className="flex-none text-[var(--color-text-muted)]" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.a}</p>}
    </div>
  );
}

export default function PlansFAQ() {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Frequently Asked Questions</p>
        <Link href="/faq" className="text-xs font-bold text-brand-blue">
          View all FAQs →
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {FAQS.map((item) => (
          <FaqItem key={item.q} item={item} />
        ))}
      </div>
    </section>
  );
}
