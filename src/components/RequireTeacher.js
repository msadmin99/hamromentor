"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RequireTeacher({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--color-text-muted)]">
        Loading Dr. Gutka...
      </div>
    );
  }

  if (!user) return null;

  const status = user.teacher_profile?.status;

  if (status === "approved") return children;

  if (status === "pending") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">⏳</span>
        <p className="text-lg font-bold text-[var(--color-text)]">Application under review</p>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          Your teacher application is pending admin approval. We&apos;ll notify you once it&apos;s reviewed.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">✕</span>
        <p className="text-lg font-bold text-[var(--color-text)]">Application not approved</p>
        {user.teacher_profile?.rejection_reason && (
          <p className="max-w-sm text-sm text-[var(--color-text-muted)]">{user.teacher_profile.rejection_reason}</p>
        )}
        <Link href="/teacher/apply" className="mt-2 rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white">
          Re-apply
        </Link>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-lg font-bold text-[var(--color-text)]">Account suspended</p>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          Your teacher account has been suspended. Contact support for details.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-3xl">🧑‍🏫</span>
      <p className="text-lg font-bold text-[var(--color-text)]">Become a teacher</p>
      <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
        Apply to become an instructor and start creating and selling your own courses.
      </p>
      <Link href="/teacher/apply" className="mt-2 rounded-xl bg-brand-blue px-5 py-2 text-sm font-bold text-white">
        Apply to teach
      </Link>
    </div>
  );
}
