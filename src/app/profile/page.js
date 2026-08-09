"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth-context";

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <AppShell>
      <Header title="Profile" showBack />

      <div className="hm-page-narrow flex flex-col gap-4">
        <div className="hm-card flex items-center gap-3 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-lg font-bold text-white">
            {(user?.first_name?.[0] || user?.email?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
          </div>
        </div>

        <div className="hm-card divide-y divide-[var(--color-border)]">
          <Row label="Phone" value={user?.phone || "-"} />
          <Row label="Program" value={user?.program || "-"} />
          <Row label="Course" value={user?.course || "-"} />
          <Row label="College" value={user?.profile?.college || "-"} />
          <Row label="District" value={user?.profile?.district || "-"} />
          <Row label="Province" value={user?.profile?.province || "-"} />
          <Row label="Exam target" value={user?.profile?.exam_target || "-"} />
          <Row label="Batch" value={user?.profile?.batch || "-"} />
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border border-brand-red py-3 text-sm font-bold text-brand-red"
        >
          Log out
        </button>
      </div>
    </AppShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium text-[var(--color-text)]">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
