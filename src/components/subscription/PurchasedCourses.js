"use client";

function formatDate(value) {
  if (!value) return "Lifetime";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function PurchasedCourses({ enrollments }) {
  const purchased = enrollments.filter((e) => e.access_type === "package");

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Purchased Courses</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Whole-course package access. Question Bank / Daily Test / Mock Test / Video subscriptions are shown above —
        this platform doesn&apos;t sell notes or test series as separate one-off products.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {purchased.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{e.course_name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Code: {e.student_code}</p>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Valid until {formatDate(e.expires_at)}</p>
          </div>
        ))}
        {purchased.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No purchased course packages yet.</p>}
      </div>
    </div>
  );
}
