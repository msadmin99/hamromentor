"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    college: "",
    program: "",
    course: "",
    referral_code: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        const firstProgram = data[0]?.program_group || "";
        const firstCourse = data.find((c) => c.program_group === firstProgram);
        setForm((f) => ({ ...f, program: firstProgram, course: firstCourse?.prefix || "" }));
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
    setSubmitting(true);
    try {
      await register(form);
      router.push("/home");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
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
          <div className="grid grid-cols-2 gap-3">
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
