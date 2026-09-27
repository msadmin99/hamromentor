"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * Persistent-but-non-blocking reminder for an unverified email address.
 *
 * Verification is OPTIONAL for using Dr. Gutka (see accounts.User.email_verified's
 * own docstring on the backend — it gates only the notification EMAIL
 * channel, never login/access) — this is a quiet, single-line notice, not
 * a modal or a dead-end screen, and it never blocks anything on the page
 * it's placed on. Renders nothing once verified, and nothing at all while
 * the user is still loading (avoids a one-frame flash before `user` is known).
 */
export default function EmailVerificationBanner({ className = "" }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  if (loading || !user || user.email_verified) return null;

  async function resend() {
    setState("sending");
    setMessage("");
    try {
      const data = await api.post("/auth/resend-verification-email/");
      setState("sent");
      setMessage(data.detail || "Verification email sent.");
    } catch (err) {
      setState("error");
      setMessage(err.status === 429 ? "Please wait a bit before requesting another email." : err.message || "Couldn't send the email.");
    }
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3.5 py-2.5 text-xs text-yellow-900 ${className}`}
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true">⚠</span>
        {state === "sent" ? message : `Please verify ${user.email} so we can send you email notifications.`}
      </span>
      {state !== "sent" && (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="flex-none rounded-lg bg-yellow-900/10 px-3 py-1 text-[11px] font-bold text-yellow-900 hover:bg-yellow-900/20 disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Resend verification email"}
        </button>
      )}
      {state === "error" && <span className="w-full text-[11px] font-medium text-brand-red">{message}</span>}
    </div>
  );
}
