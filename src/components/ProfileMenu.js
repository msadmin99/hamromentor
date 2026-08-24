"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const SUPPORT_EMAIL = "atech1627@gmail.com";

function mailto(subject) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

function formatValidity(enrollment) {
  if (!enrollment) return "No active plan";
  if (enrollment.access_type !== "package") return "Free access";
  if (!enrollment.expires_at) return "Lifetime access";
  const date = new Date(enrollment.expires_at);
  return `Valid till ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
}

function ChevronRow({ label, value, href, onClick }) {
  const body = (
    <>
      <span className="text-sm font-bold text-white">{label}</span>
      <span className="flex items-center gap-2 text-xs text-white/80">
        {value}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  );
  const className = "flex items-center justify-between px-4 py-3";
  return href ? (
    <Link href={href} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={`w-full text-left ${className}`}>
      {body}
    </button>
  );
}

async function shareApp() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Dr. Gutka", url });
    } catch {
      // user cancelled the share sheet — no-op
    }
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }
}

const SUPPORT_LINKS = [
  { label: "Learn More", href: "/" },
  { label: "FAQ", href: mailto("FAQ") },
  { label: "Contact us", href: mailto("Contact") },
  { label: "About us", href: mailto("About Us") },
  { label: "Rate us", href: mailto("Feedback / Rating") },
  { label: "T&C", href: mailto("Terms & Conditions") },
  { label: "Share the app", onClick: shareApp },
  { label: "Report video piracy", href: mailto("Report video piracy") },
];

export default function ProfileMenu({ user, onClose, align = "left" }) {
  const [enrollments, setEnrollments] = useState(null);

  useEffect(() => {
    api
      .get("/enrollments/mine/")
      .then(setEnrollments)
      .catch(() => setEnrollments([]));
  }, []);

  const enrollment = enrollments?.[0];
  const courseLabel = user?.active_course_detail?.name || enrollment?.course_name || user?.course || "—";
  const initial = (user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={onClose} />
      <div
        className={`hm-header-gradient fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-full sm:mb-2 sm:max-h-none sm:w-72 sm:overflow-hidden sm:rounded-2xl ${
          align === "right" ? "sm:right-0" : "sm:left-0"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <Link href="/settings" onClick={onClose} className="flex items-center gap-1 text-xs text-white/80">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/15 border-t border-white/15">
          <ChevronRow label="Your Course" value={courseLabel} href="/choose-course" onClick={onClose} />
          <ChevronRow label="My Performance" value="" href="/performance" onClick={onClose} />
          <ChevronRow label="Your Plan Validity" value={formatValidity(enrollment)} href="/subscriptions" onClick={onClose} />
          <ChevronRow label="Promo Codes" value="" href="/promo-codes" onClick={onClose} />
          {user?.teacher_profile?.status === "approved" ? (
            <ChevronRow label="Teacher Dashboard" value="" href="/teacher/dashboard" onClick={onClose} />
          ) : (
            <ChevronRow label="Become a Teacher" value="" href="/teacher/apply" onClick={onClose} />
          )}
        </div>

        <div className="border-t border-white/15">
          <Link href="/plans" onClick={onClose} className="block px-4 py-3 text-sm font-bold text-white">
            Buy Plan
          </Link>
        </div>

        <div className="flex flex-col border-t border-white/15 py-1">
          {SUPPORT_LINKS.map((item) =>
            item.href ? (
              <Link key={item.label} href={item.href} onClick={onClose} className="px-4 py-2 text-sm text-white/85">
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className="px-4 py-2 text-left text-sm text-white/85"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
