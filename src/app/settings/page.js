"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCourse } from "@/lib/course-context";

const PAYMENT_CHANNELS = [
  { key: "", label: "No preference" },
  { key: "bank", label: "Bank Transfer" },
  { key: "esewa", label: "eSewa" },
  { key: "khalti", label: "Khalti" },
];

function SettingsContent() {
  const { user, refresh } = useAuth();
  const { enrollments, activeCourse, switchCourse, switching } = useCourse();

  const [name, setName] = useState(`${user?.first_name || ""} ${user?.last_name || ""}`.trim());
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [paymentChannel, setPaymentChannel] = useState(user?.profile?.preferred_payment_channel || "");
  const [savingChannel, setSavingChannel] = useState(false);
  const [channelMsg, setChannelMsg] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  async function saveName(e) {
    e.preventDefault();
    setSavingName(true);
    setNameMsg("");
    try {
      await api.patch("/auth/settings/", { name });
      await refresh();
      setNameMsg("Saved.");
    } catch (err) {
      setNameMsg(err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function savePaymentChannel(value) {
    setPaymentChannel(value);
    setSavingChannel(true);
    setChannelMsg("");
    try {
      await api.patch("/auth/settings/", { preferred_payment_channel: value });
      await refresh();
      setChannelMsg("Saved — we'll pre-select this at checkout.");
    } catch (err) {
      setChannelMsg(err.message);
    } finally {
      setSavingChannel(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setSavingPw(true);
    setPwError("");
    setPwMsg("");
    try {
      await api.post("/auth/change-password/", pwForm);
      setPwMsg("Password changed.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <AppShell>
      <Header title="Settings" showBack />

      <div className="hm-page-narrow flex flex-col gap-5">
        <section className="hm-card p-4">
          <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Account</p>
          <form onSubmit={saveName} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="hm-input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">Email</label>
              <input value={user?.email || ""} disabled className="hm-input opacity-60" />
            </div>
            {nameMsg && <p className="text-xs text-brand-blue">{nameMsg}</p>}
            <button type="submit" disabled={savingName} className="self-start rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {savingName ? "Saving…" : "Save changes"}
            </button>
          </form>
          <Link href="/profile" className="mt-3 inline-block text-xs font-bold text-brand-blue">
            View full profile details →
          </Link>
        </section>

        <section className="hm-card p-4">
          <p className="mb-1 text-sm font-bold text-[var(--color-text)]">Preferred payment method</p>
          <p className="mb-3 text-xs text-[var(--color-text-muted)]">
            This platform doesn&apos;t store a card or wallet — payments are verified manually. We&apos;ll pre-select this
            channel next time you check out.
          </p>
          <select
            value={paymentChannel}
            onChange={(e) => savePaymentChannel(e.target.value)}
            disabled={savingChannel}
            className="hm-input"
          >
            {PAYMENT_CHANNELS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          {channelMsg && <p className="mt-2 text-xs text-brand-blue">{channelMsg}</p>}
        </section>

        <section className="hm-card p-4">
          <p className="mb-1 text-sm font-bold text-[var(--color-text)]">Active course</p>
          <p className="mb-3 text-xs text-[var(--color-text-muted)]">
            Your dashboard, QBank, tests and analytics are scoped to this course.
          </p>
          <div className="flex flex-col gap-2">
            {enrollments.map((e) => (
              <button
                key={e.id}
                onClick={() => switchCourse(e.course)}
                disabled={switching}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium disabled:opacity-60 ${
                  e.course === activeCourse?.id
                    ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                    : "border-[var(--color-border)] text-[var(--color-text)]"
                }`}
              >
                {e.course_name}
                {e.course === activeCourse?.id && <span className="text-xs font-bold">Active</span>}
              </button>
            ))}
            {enrollments.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)]">No active enrollments yet.</p>
            )}
          </div>
        </section>

        <section className="hm-card p-4">
          <p className="mb-3 text-sm font-bold text-[var(--color-text)]">Change password</p>
          <form onSubmit={changePassword} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
              className="hm-input"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
              className="hm-input"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
              className="hm-input"
              required
            />
            {pwError && <p className="text-xs font-medium text-brand-red">{pwError}</p>}
            {pwMsg && <p className="text-xs text-brand-blue">{pwMsg}</p>}
            <button type="submit" disabled={savingPw} className="self-start rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {savingPw ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
