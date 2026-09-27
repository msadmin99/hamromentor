"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * Account Settings' "Email" card: current address + verification status,
 * Resend Verification Email, and Change Email (inline form, matching this
 * page's own existing "Change password" inline-form pattern rather than a
 * modal). Email verification is optional for using Dr. Gutka — this card
 * only ever informs and offers actions, never blocks anything else here.
 */
export default function EmailVerificationSection() {
  const { user, refresh } = useAuth();

  const [resendState, setResendState] = useState("idle"); // idle | sending | sent | error
  const [resendMsg, setResendMsg] = useState("");

  const [changing, setChanging] = useState(false);
  const [changeForm, setChangeForm] = useState({ email: "", confirm_email: "", current_password: "" });
  const [savingChange, setSavingChange] = useState(false);
  const [changeMsg, setChangeMsg] = useState("");
  const [changeError, setChangeError] = useState("");

  async function resend() {
    setResendState("sending");
    setResendMsg("");
    try {
      const data = await api.post("/auth/resend-verification-email/");
      setResendState("sent");
      setResendMsg(data.detail || "Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendState("error");
      setResendMsg(err.status === 429 ? "Too many requests — please wait a bit before trying again." : err.message || "Couldn't send the email.");
    }
  }

  function openChangeForm() {
    setChanging(true);
    setChangeForm({ email: "", confirm_email: "", current_password: "" });
    setChangeMsg("");
    setChangeError("");
  }

  async function submitChangeEmail(e) {
    e.preventDefault();
    setChangeError("");
    setChangeMsg("");

    const newEmail = changeForm.email.trim().toLowerCase();
    const confirmEmail = changeForm.confirm_email.trim().toLowerCase();
    if (newEmail !== confirmEmail) {
      setChangeError("Email and Confirm Email must match.");
      return;
    }

    setSavingChange(true);
    try {
      await api.post("/auth/change-email/", {
        email: changeForm.email.trim(),
        current_password: changeForm.current_password,
      });
      await refresh();
      setChanging(false);
      setChangeMsg("Email changed. We've sent a new verification email to your new address — it's unverified until you confirm it.");
    } catch (err) {
      setChangeError(err.message || "Couldn't change your email.");
    } finally {
      setSavingChange(false);
    }
  }

  return (
    <section className="hm-card p-4">
      <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Email</p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-text)]">{user?.email}</p>
        {user?.email_verified ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-green">
            <span aria-hidden="true">✓</span> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700">
            <span aria-hidden="true">⚠</span> Not verified
          </span>
        )}
      </div>

      {!user?.email_verified && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Verifying is optional — you can keep using Dr. Gutka either way — but only a verified address can receive email
          notifications.
        </p>
      )}

      {changeMsg && <p className="mt-2 text-xs font-medium text-brand-blue">{changeMsg}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!user?.email_verified && resendState !== "sent" && (
          <button
            type="button"
            onClick={resend}
            disabled={resendState === "sending"}
            className="rounded-xl border border-brand-blue px-4 py-1.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/5 disabled:opacity-60"
          >
            {resendState === "sending" ? "Sending…" : "Resend Verification Email"}
          </button>
        )}
        {!changing && (
          <button type="button" onClick={openChangeForm} className="rounded-xl border border-brand-blue px-4 py-1.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/5">
            Change Email
          </button>
        )}
      </div>
      {resendMsg && (
        <p className={`mt-2 text-xs font-medium ${resendState === "error" ? "text-brand-red" : "text-brand-blue"}`}>{resendMsg}</p>
      )}

      {changing && (
        <form onSubmit={submitChangeEmail} className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Changing your email makes the new address unverified — we&apos;ll send a fresh verification email to it.
          </p>
          <div>
            <label htmlFor="new-email" className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              New email
            </label>
            <input
              id="new-email"
              type="email"
              required
              value={changeForm.email}
              onChange={(e) => setChangeForm((f) => ({ ...f, email: e.target.value }))}
              className="hm-input"
            />
          </div>
          <div>
            <label htmlFor="confirm-new-email" className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              Confirm new email
            </label>
            <input
              id="confirm-new-email"
              type="email"
              required
              value={changeForm.confirm_email}
              onChange={(e) => setChangeForm((f) => ({ ...f, confirm_email: e.target.value }))}
              className="hm-input"
            />
          </div>
          <div>
            <label htmlFor="current-password-for-email" className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              Current password
            </label>
            <input
              id="current-password-for-email"
              type="password"
              required
              value={changeForm.current_password}
              onChange={(e) => setChangeForm((f) => ({ ...f, current_password: e.target.value }))}
              className="hm-input"
            />
          </div>
          {changeError && <p className="text-xs font-medium text-brand-red">{changeError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingChange}
              className="rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingChange ? "Saving…" : "Save new email"}
            </button>
            <button
              type="button"
              onClick={() => setChanging(false)}
              disabled={savingChange}
              className="rounded-xl px-5 py-2 text-sm font-bold text-[var(--color-text-muted)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
