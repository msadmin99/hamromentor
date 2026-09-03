"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Grand Test is a SINGLE_TEST purchase — Purchase(kind='grand_test')
 * against one specific Test row, not a SubscriptionPlan at all, so it never
 * shares a card shape with the membership/bundle sections above. The actual
 * buy/start action is delegated entirely to the existing /tests/[id] page
 * (already reads the server's `access` block for Buy vs Start Test) — this
 * section is just a real, browsable list pointing at it. */
export default function SingleTestSection({ courseId }) {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    if (!courseId) return;
    api.get(`/tests/?exam_type=grand&course=${courseId}`).then(setTests);
  }, [courseId]);

  return (
    <section>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-extrabold text-[var(--color-text)]">Grand Test</h3>
        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-violet-700">
          SINGLE TEST
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Experience a complete exam simulation.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => {
          // Unified catalog/access remediation: this used to read
          // `ownedTestIds.has(t.id) || !t.is_pro` — a client-supplied
          // GrandTestAccess-only prop plus a price flag, so a student who
          // held Grand Test access through a Subscription, Combo,
          // Scholarship, or assignment (any source other than a direct
          // GrandTestAccess purchase) saw "Buy Now" on a test they could
          // already start — the exact "paid user sees a false lock" defect
          // this remediation targets. `t.access` is the same server-derived
          // projection (tests_app/card_access.py) ExamCard already reads
          // elsewhere; every entitlement source is already resolved into
          // it, so this list needs no source-specific prop of its own.
          const owned = t.access?.can_start || t.access?.can_continue || t.access?.can_review;
          return (
            <Link
              key={t.id}
              href={`/tests/${t.id}`}
              className="hm-card flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-[var(--color-text)]">{t.title}</p>
                {owned && (
                  <span className="flex-none rounded-md bg-brand-green-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
                    PURCHASED
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Full Syllabus · Exam Pattern Aligned · Detailed Analysis
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                {owned ? (
                  <span className="text-sm font-bold text-brand-blue">Start Test →</span>
                ) : (
                  <>
                    <span className="text-lg font-extrabold text-[var(--color-text)]">Rs. {t.price}</span>
                    <span className="text-sm font-bold text-brand-blue">Buy Now →</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
        {tests.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            No Grand Tests available for this course yet.
          </p>
        )}
      </div>
    </section>
  );
}
