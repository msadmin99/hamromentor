"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CheckoutModal from "@/components/CheckoutModal";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

function TestDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  function load() {
    api.get(`/tests/${id}/`).then((data) => {
      setTest(data);
      if (data.has_access && data.requires_password) setNeedsPassword(true);
    });
  }
  useEffect(load, [id]);

  async function startTest() {
    setError("");
    setStarting(true);
    try {
      const attempt = await api.post(`/tests/${id}/start/`, needsPassword ? { access_password: password } : {});
      router.push(`/tests/attempt/${attempt.id}`);
    } catch (err) {
      if (err.status === 402) {
        setError(err.message);
      } else if (err.status === 403 && /password|exam/i.test(err.message)) {
        setNeedsPassword(true);
        setError(password ? "Incorrect password." : "This test is password-protected.");
      } else {
        setError(err.message);
      }
    } finally {
      setStarting(false);
    }
  }

  if (!test) {
    return (
      <AppShell>
        <Header title="Test" showBack />
        <p className="hm-page-narrow text-sm text-[var(--color-text-muted)]">Loading…</p>
      </AppShell>
    );
  }

  const attemptsUsed = test.attempts_used ?? 0;
  const attemptsLeft = Math.max(0, test.max_attempts - attemptsUsed);
  const exhausted = attemptsLeft <= 0;
  const previewOnly = test.is_pro && !test.has_access && test.free_preview_questions > 0 && test.exam_type !== "grand";
  const locked = test.is_pro && !test.has_access;

  return (
    <AppShell>
      <Header title={test.subject_name || "Test"} showBack />
      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--color-text)]">{test.title}</h2>
            {test.is_pro && (
              <span className="rounded-md bg-brand-green-light px-2 py-1 text-[10px] font-bold text-brand-green">
                PRO
              </span>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Duration" value={`${test.duration_minutes} mins`} />
            <Info label="Questions" value={test.question_count} />
            <Info label="Total marks" value={test.total_marks} />
            <Info label="Negative marking" value={test.negative_marking ? "Yes" : "No"} />
          </dl>
          {test.price && <p className="mt-3 text-sm font-semibold text-brand-blue">Price: Rs. {test.price}</p>}
        </div>

        <div className={`hm-card flex items-center justify-between p-4 ${exhausted ? "border-brand-red" : ""}`}>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Attempts</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {attemptsUsed} of {test.max_attempts} used
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${
              exhausted ? "bg-brand-red-light text-brand-red" : "bg-brand-green-light text-brand-green"
            }`}
          >
            {exhausted ? "No attempts left" : `${attemptsLeft} left`}
          </span>
        </div>

        {test.best_score != null && test.latest_attempt_id && (
          <Link
            href={`/tests/result/${test.latest_attempt_id}`}
            className="rounded-xl border border-brand-blue px-6 py-2.5 text-center text-sm font-bold text-brand-blue"
          >
            📖 View Result (Best score: {test.best_score})
          </Link>
        )}

        {test.best_score != null && (
          <Link
            href={`/tests/history?test=${test.id}`}
            className="text-center text-sm font-bold text-brand-blue"
          >
            View your previous attempts →
          </Link>
        )}

        {locked && test.exam_type === "grand" && (
          <div className="hm-card border-brand-blue p-4 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">This is a paid Grand Test.</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Buy it once — you&apos;ll get a unique password by email once your payment is approved.
            </p>
            <button onClick={() => setShowCheckout(true)} className="mt-3 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white">
              Buy for Rs. {test.price}
            </button>
          </div>
        )}

        {locked && test.exam_type !== "grand" && !previewOnly && (
          <div className="hm-card border-brand-blue p-4 text-center">
            <p className="text-sm font-semibold text-[var(--color-text)]">This test requires an active subscription.</p>
            <Link href="/plans" className="mt-3 inline-block rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white">
              View Plans
            </Link>
          </div>
        )}

        {previewOnly && (
          <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
            Preview mode — you can view the first {test.free_preview_questions} question(s) but need to{" "}
            <Link href="/plans" className="font-bold underline">
              subscribe
            </Link>{" "}
            to submit.
          </p>
        )}

        {(!locked || test.exam_type === "grand" || previewOnly) && needsPassword && !exhausted && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              {test.exam_type === "grand" ? "Your unique exam password" : "Test password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hm-input"
              placeholder="Enter password"
            />
          </div>
        )}

        {error && <p className="rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">{error}</p>}

        {(!locked || previewOnly) && (
          <button
            onClick={startTest}
            disabled={starting || exhausted}
            className="rounded-xl bg-brand-blue py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {exhausted ? "No attempts left" : starting ? "Starting…" : previewOnly ? "Preview test" : "Start test"}
          </button>
        )}

        {showCheckout && (
          <CheckoutModal
            kind="grand_test"
            grandTest={test}
            onClose={() => setShowCheckout(false)}
            onSubmitted={load}
          />
        )}
      </div>
    </AppShell>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-semibold text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

export default function TestDetailPage() {
  return (
    <RequireAuth>
      <TestDetailContent />
    </RequireAuth>
  );
}
