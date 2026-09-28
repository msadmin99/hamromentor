"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { SupportContactInline } from "@/components/SupportContact";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    confirm_email: "",
    phone: "",
    password: "",
    college: "",
    program: "",
    course: "",
    referral_code: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Registration itself never blocks on verification (accounts.User.email_verified
  // is optional — see the backend field's own docstring): a successful
  // register() call always logs the student in immediately. This screen
  // only ever ADDS a "here's your registered email, verification is
  // recommended but optional" message on top of that — it never becomes a
  // dead end, and Continue always works even if verification is skipped.
  const [registered, setRegistered] = useState(null); // { email } once registration succeeds
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent | error
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    // Read outside next/navigation's useSearchParams so this page can stay statically
    // prerendered — a shared referral link (?ref=CODE) still pre-fills the field.
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setForm((f) => ({ ...f, referral_code: ref.toUpperCase() }));
  }, []);

  useEffect(() => {
    // Program/Course options come straight from Course Management (admin) —
    // no hardcoded list to keep in sync by hand.
    api
      .get("/courses/")
      .then((data) => {
        setCourses(data);
        // Default to CEE-UG / MBBS specifically, not "whichever course
        // happens to come first from the API" (which could just as easily
        // land on a PG program). The vast majority of registrants are
        // undergraduate students who have never heard of the PG programs —
        // defaulting them into one is confusing at best. Falls back to the
        // old "first available" behavior only if CEE-UG/MBBS isn't in the
        // list at all (e.g. Course Management renamed/removed it).
        const defaultCourse =
          data.find((c) => c.program_group === "CEE-UG" && c.prefix === "MBBS") || data[0];
        const defaultProgram = defaultCourse?.program_group || "";
        setForm((f) => ({ ...f, program: defaultProgram, course: defaultCourse?.prefix || "" }));
      })
      .catch(() => {});
  }, []);

  const programGroups = useMemo(() => {
    const seen = new Set();
    return courses.map((c) => c.program_group).filter((p) => p && !seen.has(p) && seen.add(p));
  }, [courses]);

  const coursesForProgram = useMemo(
    () => courses.filter((c) => c.program_group === form.program),
    [courses, form.program]
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateProgram(program) {
    const firstCourse = courses.find((c) => c.program_group === program);
    setForm((f) => ({ ...f, program, course: firstCourse?.prefix || "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.email.trim().toLowerCase() !== form.confirm_email.trim().toLowerCase()) {
      setError("Email and Confirm Email must match.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await register(form);
      // Registration already sends a verification email server-side
      // (accounts.RegisterSerializer.create()) — this screen doesn't send
      // a second one; it just tells the student what happened and lets
      // them resend from here if needed.
      setRegistered({ email: user?.email || form.email.trim() });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    setResendState("sending");
    setResendMsg("");
    try {
      const data = await api.post("/auth/resend-verification-email/");
      setResendState("sent");
      setResendMsg(data.detail || "Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendState("error");
      setResendMsg(err.status === 429 ? "Please wait a bit before requesting another email." : err.message || "Couldn't send the email.");
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--color-surface-muted)]">
        <div className="hm-header-gradient flex flex-col items-center justify-center gap-2 px-6 py-10 text-white">
          <Logo size={44} showWordmark={false} />
          <h1 className="text-xl font-extrabold tracking-tight">Registration successful</h1>
        </div>
        <div className="flex flex-1 justify-center px-4 pb-10 sm:px-6 sm:pt-8">
          <div className="-mt-6 w-full max-w-md rounded-t-3xl bg-white px-6 pt-8 pb-10 text-center sm:mt-0 sm:rounded-3xl sm:border sm:border-[var(--color-border)] sm:shadow-sm">
            <p className="text-sm text-[var(--color-text)]">Your account has been created.</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Registered email</p>
            <p className="mt-1 text-sm font-bold text-[var(--color-text)]">{registered.email}</p>

            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              We sent a verification email to this address. Please verify your email so we can send email notifications to
              you.
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
              Verification is optional — you can continue using Dr. Gutka even if you verify later.
            </p>

            {resendMsg && (
              <p className={`mt-3 text-xs font-medium ${resendState === "error" ? "text-brand-red" : "text-brand-blue"}`}>{resendMsg}</p>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="rounded-xl bg-brand-blue py-3 text-sm font-bold text-white transition active:scale-[0.99]"
              >
                Continue to Dr. Gutka
              </button>
              {resendState !== "sent" && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendState === "sending"}
                  className="rounded-xl border border-brand-blue py-3 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/5 disabled:opacity-60"
                >
                  {resendState === "sending" ? "Sending…" : "Resend Verification Email"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-muted)]">
      <div className="hm-header-gradient flex flex-col items-center justify-center gap-2 px-6 py-10 text-white">
        <Logo size={44} showWordmark={false} />
        <h1 className="text-xl font-extrabold tracking-tight">Create your account</h1>
      </div>

      <div className="flex flex-1 justify-center px-4 pb-10 sm:px-6 sm:pt-8">
      <div className="-mt-6 w-full max-w-md rounded-t-3xl bg-white px-6 pt-8 pb-10 sm:mt-0 sm:rounded-3xl sm:border sm:border-[var(--color-border)] sm:shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ram Sharma"
              className="hm-input"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className="hm-input"
            />
          </Field>
          <Field label="Confirm Email">
            <input
              required
              type="email"
              value={form.confirm_email}
              onChange={(e) => update("confirm_email", e.target.value)}
              placeholder="Re-enter your email"
              aria-describedby="confirm-email-hint"
              className="hm-input"
            />
            <p id="confirm-email-hint" className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              This only checks for typos — verifying that you own this address happens later, by email.
            </p>
          </Field>
          <Field label="Phone">
            <input
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="98XXXXXXXX"
              className="hm-input"
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
              className="hm-input"
            />
          </Field>
          <Field label="College Name">
            <input
              required
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
              placeholder="e.g. Tribhuvan University Teaching Hospital"
              className="hm-input"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Program">
              <select value={form.program} onChange={(e) => updateProgram(e.target.value)} className="hm-input">
                {programGroups.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Course">
              <select value={form.course} onChange={(e) => update("course", e.target.value)} className="hm-input">
                {coursesForProgram.map((c) => (
                  <option key={c.id} value={c.prefix}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Referred By (Optional)">
            <input
              value={form.referral_code}
              onChange={(e) => update("referral_code", e.target.value.toUpperCase())}
              placeholder="e.g. PUNAM50"
              className="hm-input font-mono"
            />
          </Field>

          {error && <p className="rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-brand-blue py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-blue">
            Log in
          </Link>
        </p>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-center">
          <SupportContactInline
            heading="Need help? Contact Dr. Gutka Support"
            whatsappMessage="Hello Dr. Gutka Support, I need help with registration."
            className="mx-auto flex flex-col items-center [&_div]:justify-center"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">{label}</label>
      {children}
    </div>
  );
}
