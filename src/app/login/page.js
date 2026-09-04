"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(identifier, password);
      router.push("/home");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-muted)]">
      <div className="hm-header-gradient flex flex-col items-center justify-center gap-3 px-6 py-14 text-white">
        <Logo size={56} showWordmark={false} />
        <h1 className="text-2xl font-extrabold tracking-tight">
          Dr. <span className="text-brand-red">Gutka</span>
        </h1>
        <p className="text-sm text-white/85">Your companion for CEE-PG & NMCLE prep</p>
      </div>

      <div className="flex flex-1 justify-center px-4 pb-10 sm:px-6 sm:pt-8">
      <div className="-mt-6 w-full max-w-md rounded-t-3xl bg-white px-6 pt-8 pb-10 sm:mt-0 sm:rounded-3xl sm:border sm:border-[var(--color-border)] sm:shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Welcome back</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Log in to continue solving.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="login-identifier" className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
              Email or phone
            </label>
            <input
              id="login-identifier"
              name="identifier"
              required
              /* autoComplete lets a password manager and the browser's own
                 autofill work, which is an accessibility aid for anyone who
                 finds typing costly, not just a convenience. */
              autoComplete="username"
              aria-describedby={error ? "login-error" : undefined}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Password</label>
            <input
              id="login-password"
              name="password"
              required
              autoComplete="current-password"
              aria-describedby={error ? "login-error" : undefined}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-brand-blue"
            />
          </div>

          {/* role="alert" so a login failure is announced rather than
              silently repainting, and id-linked from both inputs via
              aria-describedby so the reason is read when focus returns to
              the field the user has to correct. */}
          {error && (
            <p id="login-error" role="alert" className="rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          New to Dr. Gutka?{" "}
          <Link href="/register" className="font-semibold text-brand-blue">
            Create an account
          </Link>
        </p>

        <p className="mt-4 rounded-xl bg-[var(--color-surface-muted)] p-3 text-center text-[11px] text-[var(--color-text-muted)]">
          Demo login: student@hamromentor.com / Student@123
        </p>
      </div>
      </div>
    </div>
  );
}
