"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import RequireTeacher from "@/components/RequireTeacher";
import { api } from "@/lib/api";

const LEVELS = [
  { key: "", label: "Not set" },
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];

const ACCESS_DURATIONS = [
  { key: "lifetime", label: "Lifetime" },
  { key: "30_days", label: "30 days" },
  { key: "90_days", label: "90 days" },
  { key: "180_days", label: "180 days" },
  { key: "1_year", label: "1 year" },
  { key: "custom", label: "Custom" },
];

function NewCourseContent() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    short_description: "",
    description: "",
    level: "",
    price: "0",
    is_free: false,
    access_duration_type: "lifetime",
    access_duration_days: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/course-categories/").then(setCategories);
  }, []);

  async function submit() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const created = await api.post("/teacher-courses/", {
        ...form,
        category: form.category || null,
        price: form.is_free ? 0 : Number(form.price) || 0,
        access_duration_days: form.access_duration_type === "custom" ? Number(form.access_duration_days) || null : null,
      });
      router.push(`/teacher/courses/${created.id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hm-page-narrow flex flex-col gap-4 py-6">
      <h1 className="text-xl font-bold text-[var(--color-text)]">Create Course</h1>

      <div className="hm-card flex flex-col gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Course title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="hm-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="hm-input">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Short description</label>
          <input
            value={form.short_description}
            onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
            className="hm-input"
            maxLength={300}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="hm-input"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Level</label>
            <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="hm-input">
              {LEVELS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Access duration</label>
            <select
              value={form.access_duration_type}
              onChange={(e) => setForm((f) => ({ ...f, access_duration_type: e.target.value }))}
              className="hm-input"
            >
              {ACCESS_DURATIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.access_duration_type === "custom" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Custom duration (days)</label>
            <input
              type="number"
              min={1}
              value={form.access_duration_days}
              onChange={(e) => setForm((f) => ({ ...f, access_duration_days: e.target.value }))}
              className="hm-input"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={form.is_free} onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))} />
          This course is free
        </label>
        {!form.is_free && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Price (Rs.)</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="hm-input w-40"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-brand-red">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="self-start rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create & add curriculum →"}
      </button>
    </div>
  );
}

export default function NewCoursePage() {
  return (
    <RequireTeacher>
      <AppShell>
        <NewCourseContent />
      </AppShell>
    </RequireTeacher>
  );
}
