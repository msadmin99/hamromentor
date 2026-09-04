"use client";

/**
 * Profile redesign (Phase B) — the exact same fields the previous /profile
 * page showed (user.phone/program/course, user.profile.college/district/
 * province/exam_target/batch), same "-" fallback for an empty field. Only
 * the surrounding presentation changed (grouped under a section heading
 * inside the new Account & Settings area, instead of being the whole page).
 */
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="flex-none text-[var(--color-text-muted)]">{label}</span>
      <span className="min-w-0 truncate font-medium text-[var(--color-text)]">{value}</span>
    </div>
  );
}

export default function PersonalInfoCard({ user }) {
  return (
    <section>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Personal Information</p>
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
    </section>
  );
}
