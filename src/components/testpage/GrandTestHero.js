"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
import { api } from "@/lib/api";
import { useCourse } from "@/lib/course-context";

const FEATURES = ["Full-length exam simulation", "All India rank estimate", "Detailed analytics", "Detailed solutions"];

/** Grand Test's dominant hero — features the most-attempted available Grand
 * Test (GET /tests/recommended/?exam_type=grand), reusing the exact same
 * purchase flow (CheckoutModal, has_access/price/requires_password) the
 * test detail page (/tests/[id]) already uses. No new purchase logic. */
export default function GrandTestHero({ onPurchased }) {
  const { activeCourse } = useCourse();
  const [rec, setRec] = useState(undefined);
  const [test, setTest] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  function load() {
    setRec(undefined);
    setTest(null);
    const params = new URLSearchParams({ exam_type: "grand" });
    if (activeCourse?.id) params.set("course", activeCourse.id);
    api
      .get(`/tests/recommended/?${params.toString()}`)
      .then((data) => {
        setRec(data);
        if (data.test_id) api.get(`/tests/${data.test_id}/`).then(setTest);
      })
      .catch(() => setRec(null));
  }

  useEffect(load, [activeCourse?.id]);

  if (rec === undefined) {
    return (
      <div className="hm-card animate-pulse p-6">
        <div className="h-3 w-32 rounded bg-white/20" />
        <div className="mt-3 h-7 w-72 rounded bg-white/20" />
        <div className="mt-6 h-10 w-40 rounded-xl bg-white/20" />
      </div>
    );
  }

  if (!rec?.test_id || !test) {
    return (
      <div className="hm-card p-6 text-center">
        <p className="text-base font-extrabold text-[var(--color-text)]">No Grand Test available yet.</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">We&apos;ll notify you when the next Grand Test is scheduled.</p>
        <Link href="/mock-test" className="mt-3 inline-block text-sm font-bold text-brand-blue">
          View Other Tests →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md sm:flex sm:items-center sm:justify-between sm:gap-6"
      style={{ background: "linear-gradient(135deg, var(--color-brand-blue-dark) 0%, var(--color-brand-blue) 100%)" }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🏆</span>
          <h2 className="text-2xl font-extrabold">Compete at the Highest Level</h2>
        </div>
        <p className="mt-2 max-w-lg text-sm text-white/80">
          {test.description || "Full-length, high-yield tests that simulate the real exam environment and benchmark you against top aspirants."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
              <span aria-hidden="true">✔</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex-none rounded-2xl bg-white p-4 text-[var(--color-text)] shadow-lg sm:mt-0 sm:w-64">
        {test.has_access ? (
          <>
            <p className="text-sm font-bold">{test.title}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">You have access to this Grand Test.</p>
            <Link
              href={`/tests/${test.id}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-sm font-bold text-white"
            >
              Start Grand Test <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-bold">Access Grand Test</p>
            <p className="text-xs text-[var(--color-text-muted)]">Single test purchase</p>
            <p className="mt-2 text-2xl font-extrabold">Rs. {test.price}</p>
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue-dark py-2.5 text-sm font-bold text-white"
            >
              <span aria-hidden="true">🔒</span> Unlock & Buy Now
            </button>
            <p className="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">Secure payment · Instant access</p>
          </>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          kind="grand_test"
          grandTest={test}
          onClose={() => setShowCheckout(false)}
          onSubmitted={() => {
            load();
            onPurchased?.();
          }}
        />
      )}
    </div>
  );
}
