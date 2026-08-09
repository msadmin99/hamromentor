"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function ApplyContent() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ bio: "", qualification: "", specialization: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const status = user?.teacher_profile?.status;
  if (status === "approved" || status === "pending" || status === "rejected" || status === "suspended") {
    router.replace("/teacher/dashboard");
    return null;
  }

  async function submit() {
    if (!form.qualification.trim()) {
      setError("Qualification is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.post("/teacher-applications/", form);
      await refresh();
      router.push("/teacher/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hm-page-narrow flex flex-col gap-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">Apply to teach</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Tell us about your background — an admin will review your application.
        </p>
      </div>

      <div className="hm-card flex flex-col gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
            Qualification (e.g. &quot;MBBS | Medical Educator&quot;)
          </label>
          <input
            value={form.qualification}
            onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
            className="hm-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Specialization</label>
          <input
            value={form.specialization}
            onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
            className="hm-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Bio</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="hm-input"
            placeholder="Your teaching experience, background, and what you'd like to teach."
          />
        </div>
      </div>

      {error && <p className="text-sm font-medium text-brand-red">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="self-start rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Submitting…" : "Submit application"}
      </button>
    </div>
  );
}

export default function TeacherApplyPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ApplyContent />
      </AppShell>
    </RequireAuth>
  );
}
