"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { quotaFor } from "@/lib/accessState";
import { api } from "@/lib/api";

/**
 * Phase 10 — "what free access do I still have?", answered by the server.
 *
 * Reads `GET /api/entitlements/mine/` (Phase 2/3), which is the only place
 * these numbers exist. Nothing here computes, caches or decrements a
 * quota: browsing must never consume Free Starter, and this component
 * performs one read and no writes.
 *
 * Shown at the few moments the number is useful — the dashboard, and the
 * point where a student hits a limit — rather than on every page, which
 * would turn a helpful number into background anxiety.
 */
const BUCKETS = [
  { key: "mock_test", label: "Mock tests", unit: "test" },
  { key: "daily_test", label: "Daily tests", unit: "test" },
  { key: "pyq", label: "Past year sets", unit: "set" },
  { key: "qbank", label: "Practice questions", unit: "question" },
  { key: "grand_test", label: "Grand tests", unit: "test" },
];

export default function FreeAccessSummary({ className = "" }) {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get("/entitlements/mine/")
      .then((data) => alive && setRows(Array.isArray(data) ? data : []))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // Silent when there is nothing to say: still loading, the call failed
  // (a quota panel is not worth an error banner), or this student has no
  // free allowance configured at all.
  if (failed || rows === null) return null;

  const quotas = BUCKETS.map((bucket) => ({ ...bucket, quota: quotaFor(rows, bucket.key) })).filter((b) => b.quota);
  if (quotas.length === 0) return null;

  const anyLeft = quotas.some((b) => b.quota.unlimited || b.quota.remaining > 0);

  return (
    <section className={`hm-card p-4 ${className}`} aria-labelledby="free-access-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="free-access-heading" className="text-sm font-bold text-[var(--color-text)]">
          Your free access
        </h2>
        {!anyLeft && (
          <Link href="/plans" className="text-xs font-bold text-brand-blue underline">
            View plans
          </Link>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {quotas.map(({ key, label, unit, quota }) => (
          <li key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--color-text-muted)]">{label}</span>
            {quota.unlimited ? (
              <span className="font-bold text-brand-green">Unlimited</span>
            ) : (
              // Never colour alone: exhausted states also say "used" in
              // words, so the state survives greyscale and screen readers.
              <span className={`font-bold ${quota.exhausted ? "text-[var(--color-text-muted)]" : "text-brand-green"}`}>
                {quota.exhausted
                  ? "Used"
                  : `${quota.remaining} ${unit}${quota.remaining === 1 ? "" : "s"} left`}
              </span>
            )}
          </li>
        ))}
      </ul>

      {!anyLeft && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          You&apos;ve used your free access. Upgrade to keep practising.
        </p>
      )}
    </section>
  );
}
