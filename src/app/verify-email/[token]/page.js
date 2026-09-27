"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * The page a verification-email link opens (built from the exact same
 * relative path `notifications/email_content.py`'s FRONTEND_URL-joining
 * convention uses on the backend: `${FRONTEND_URL}/verify-email/<token>`
 * — see accounts/email_verification.py's send_verification_email).
 *
 * Calls the existing backend contract, POST /auth/verify-email/<token>/,
 * exactly once — not on link-open by some other automated fetch, and
 * never twice from this page itself (React StrictMode / a fast remount
 * would otherwise double-submit a one-time-use token) — `submittedRef`
 * guards that. The raw token is never logged: it only ever appears in
 * the URL (already the case, since that's how the link necessarily
 * works) and in this one POST body.
 */
export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [state, setState] = useState("loading"); // loading | success | error
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current || !token) return;
    submittedRef.current = true;

    api
      .post(`/auth/verify-email/${encodeURIComponent(token)}/`, undefined, { auth: false })
      .then(async () => {
        setState("success");
        // If this browser happens to be logged in as the account that just
        // verified (the common case — registration auto-logs-in), refresh
        // the cached profile so email_verified flips to true immediately,
        // with no logout/login round-trip needed anywhere in the app.
        if (user) await refresh();
      })
      .catch((err) => {
        setState("error");
        setErrorCode(err.data?.code || "");
        setErrorMessage(err.message || "Something went wrong. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const ERROR_COPY = {
    expired_token: {
      title: "This link has expired",
      body: "Verification links expire after 24 hours for security. Request a new one from Account Settings.",
    },
    already_used: {
      title: "Already verified",
      body: "This verification link has already been used. If your email shows as verified, you're all set.",
    },
    invalid_token: {
      title: "Invalid verification link",
      body: "This link isn't valid — it may have been mistyped, or a newer verification email may have replaced it.",
    },
  };
  const knownError = ERROR_COPY[errorCode];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-[var(--color-surface-muted)] px-6 py-10">
      <Logo size={44} showWordmark={false} />
      <div className="mt-4 w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white px-6 py-8 text-center shadow-sm">
        {state === "loading" && (
          <>
            <div
              role="status"
              aria-label="Verifying your email"
              className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent"
            />
            <p className="mt-4 text-sm font-semibold text-[var(--color-text)]">Verifying your email…</p>
          </>
        )}

        {state === "success" && (
          <>
            <p className="text-3xl" aria-hidden="true">
              ✓
            </p>
            <h1 className="mt-2 text-lg font-extrabold text-[var(--color-text)]">Email verified</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Thanks — your email address is now confirmed. You&apos;ll receive email notifications going forward.
            </p>
            <button
              type="button"
              onClick={() => router.push(user ? "/home" : "/login")}
              className="mt-6 w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white transition active:scale-[0.99]"
            >
              Continue to Dr. Gutka
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <p className="text-3xl" aria-hidden="true">
              ⚠
            </p>
            <h1 className="mt-2 text-lg font-extrabold text-[var(--color-text)]">{knownError?.title || "Couldn't verify your email"}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{knownError?.body || errorMessage}</p>
            <div className="mt-6 flex flex-col gap-2.5">
              {user && (
                <Link
                  href="/settings"
                  className="rounded-xl bg-brand-blue py-3 text-center text-sm font-bold text-white transition active:scale-[0.99]"
                >
                  Go to Account Settings to resend
                </Link>
              )}
              <button
                type="button"
                onClick={() => router.push(user ? "/home" : "/login")}
                className="rounded-xl border border-brand-blue py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5"
              >
                Continue to Dr. Gutka
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
