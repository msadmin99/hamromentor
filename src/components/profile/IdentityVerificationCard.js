"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon, ShieldIcon, WarningTriangleIcon } from "../icons";
import { api, uploadFields } from "@/lib/api";

/**
 * Student Identity & Document Verification System — the student-facing
 * upload/status card. Reads/writes GET+POST /auth/me/verification/ only;
 * never touches any exam-access endpoint. Entirely optional: nothing on
 * this card is required to use QBank, Daily/Mock/Grand Test, PYQ, or any
 * course — see accounts/tests_verification.py's access-regression suite,
 * which proves this server-side. The reassurance copy below exists
 * because the whole point of this feature is that verification is
 * additive trust-building, never a gate — students should never worry
 * that skipping this locks them out of anything.
 */
const DOCUMENT_TYPES = [
  { value: "citizenship", label: "Citizenship" },
  { value: "passport", label: "Passport" },
  { value: "academic_certificate", label: "Academic Certificate" },
  { value: "identity_document", label: "Identity Document" },
  { value: "other", label: "Other" },
];

const DOC_STATUS_META = {
  approved: { label: "Approved", className: "bg-brand-green-light text-brand-green" },
  pending: { label: "Under review", className: "bg-warning-soft text-amber-700" },
  rejected: { label: "Rejected", className: "bg-brand-red-light text-brand-red" },
};

const PROFILE_STATUS_META = {
  verified: { Icon: CheckCircleIcon, className: "bg-brand-green-light text-brand-green", label: "Verified" },
  pending: { Icon: ClockIcon, className: "bg-warning-soft text-amber-700", label: "Pending review" },
  rejected: { Icon: WarningTriangleIcon, className: "bg-brand-red-light text-brand-red", label: "Rejected" },
  unverified: { Icon: ShieldIcon, className: "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]", label: "Not submitted" },
};

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function load(setData) {
  api.get("/auth/me/verification/").then(setData).catch(() => setData(null));
}

export default function IdentityVerificationCard() {
  const [data, setData] = useState(undefined); // undefined = loading, null = error
  const [documentType, setDocumentType] = useState("citizenship");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => load(setData), []);

  const iconBadge = (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
      <ShieldIcon />
    </span>
  );

  if (data === undefined) {
    return (
      <section className="hm-card animate-pulse p-4 sm:p-5">
        <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-muted)]" />
        <div className="mt-3 h-5 w-40 rounded bg-[var(--color-surface-muted)]" />
        <div className="mt-2 h-3 w-56 rounded bg-[var(--color-surface-muted)]" />
      </section>
    );
  }

  if (data === null) {
    return (
      <section className="hm-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {iconBadge}
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Identity Verification</p>
        </div>
        <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">Unable to load your verification status.</p>
        <button type="button" onClick={() => { setData(undefined); load(setData); }} className="mt-2 text-xs font-bold text-brand-blue">
          Try again
        </button>
      </section>
    );
  }

  const meta = PROFILE_STATUS_META[data.verification_status] || PROFILE_STATUS_META.unverified;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await uploadFields("/auth/me/verification/", "POST", { document_type: documentType, file });
      setFile(null);
      load(setData);
    } catch (err) {
      setError(err.message || "Could not submit document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="hm-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {iconBadge}
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Identity Verification</p>
        </div>
        <span className={`flex flex-none items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${meta.className}`}>
          <meta.Icon /> {meta.label}
        </span>
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        Optional — verifying your identity helps build trust with instructors, but never affects your access to QBank,
        tests, or courses.
      </p>

      {data.verification_status === "rejected" && data.verification_rejection_reason && (
        <p className="mt-2 rounded-lg bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red">
          {data.verification_rejection_reason}
        </p>
      )}

      {data.documents.length > 0 && (
        <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
          {data.documents.map((doc) => {
            const docMeta = DOC_STATUS_META[doc.status] || DOC_STATUS_META.pending;
            return (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-text)]">
                    {DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Submitted {formatDate(doc.uploaded_at)}</p>
                </div>
                <span className={`flex-none rounded-md px-2 py-0.5 text-[10px] font-bold ${docMeta.className}`}>{docMeta.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="min-h-[40px] flex-1 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text)]"
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="min-h-[40px] flex-1 rounded-lg border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs text-[var(--color-text-muted)] file:mr-2 file:rounded-md file:border-0 file:bg-brand-blue/10 file:px-2 file:py-1 file:text-xs file:font-bold file:text-brand-blue"
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[40px] flex-none rounded-xl bg-brand-blue px-4 text-xs font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Uploading…" : "Submit"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-semibold text-brand-red">{error}</p>}
    </section>
  );
}
