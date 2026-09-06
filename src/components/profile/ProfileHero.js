"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CameraIcon, EditIcon } from "../icons";
import { uploadFields } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * Profile redesign (Phase B) — horizontal hero card: avatar, name, active
 * course, email, and an Edit Profile CTA. Every field is read straight off
 * the existing `useAuth()` user object (see profile/page.js) — nothing new
 * is fetched, nothing is invented if a field is empty.
 *
 * "Edit Profile" links to /settings rather than a new editor: /settings is
 * the only place account fields are actually editable today (name, in
 * particular). Inventing a separate profile-editing surface would be new
 * functionality this phase isn't authorized to build.
 *
 * Subtle brand-tinted background (a soft wash of the existing teal tokens,
 * not a new color and not the bold saturated gradient the top Header
 * already uses) — per the brief's explicit "avoid excessive gradients."
 *
 * Identity & Document Verification: the avatar now shows the real
 * StudentProfile.photo when set (GCS-backed, see accounts/verification_storage.py)
 * with a small camera button to replace it, and a verification-status pill
 * next to the name. Purely informational — this status is never read by
 * any exam-access check (tests_app/access.py, billing/access.py); see
 * accounts/tests_verification.py's regression suite. Uploading/verifying a
 * photo is entirely optional and never blocks anything on this page.
 */
const STATUS_META = {
  verified: { label: "Verified", className: "bg-brand-green-light text-brand-green" },
  pending: { label: "Verification pending", className: "bg-warning-soft text-amber-700" },
  rejected: { label: "Verification rejected", className: "bg-brand-red-light text-brand-red" },
  unverified: { label: "Not verified", className: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" },
};

export default function ProfileHero({ user, courseName }) {
  const { refresh } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const initial = (user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Student";
  const photoUrl = user?.profile?.photo || null;
  const statusMeta = STATUS_META[user?.profile?.verification_status] || null;

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadFields("/auth/me/photo/", "POST", { photo: file });
      await refresh();
    } catch (err) {
      setError(err.message || "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand-teal-via)]/[0.06] to-[var(--color-brand-teal-to)]/[0.12] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex-none">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-blue text-xl font-bold text-white sm:h-[72px] sm:w-[72px] sm:text-2xl">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-blue text-white shadow-sm transition hover:bg-brand-blue/90 disabled:opacity-60"
            >
              <CameraIcon />
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-extrabold text-[var(--color-text)] sm:text-xl">{fullName}</p>
              {statusMeta && (
                <span className={`flex-none rounded-md px-2 py-0.5 text-[10px] font-bold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              )}
            </div>
            {courseName && <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-marketing-bar)]">{courseName}</p>}
            {user?.email && <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>}
            {error && <p className="mt-0.5 text-xs font-semibold text-brand-red">{error}</p>}
          </div>
        </div>

        <Link
          href="/settings"
          className="flex min-h-[44px] flex-none items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:border-brand-blue hover:text-brand-blue"
        >
          <EditIcon /> Edit Profile
        </Link>
      </div>
    </section>
  );
}
