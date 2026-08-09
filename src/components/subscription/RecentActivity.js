"use client";

const STATUS_ICON = { approved: "✅", rejected: "❌", pending: "⏳", unpaid: "🛒", resubmission_requested: "⚠️" };
const STATUS_LABEL = {
  approved: "approved",
  rejected: "rejected",
  pending: "submitted, awaiting review",
  unpaid: "created, awaiting payment",
  resubmission_requested: "sent back for new proof",
};

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function RecentActivity({ purchases }) {
  const events = purchases.slice(0, 10);

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Recent Activity</p>
      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
        A record of your own subscription purchases and their review status.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {events.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-xs">
            <span>{STATUS_ICON[p.status]}</span>
            <span className="text-[var(--color-text)]">
              {p.kind === "grand_test" ? p.grand_test_title : p.plan_name} purchase {STATUS_LABEL[p.status]}
            </span>
            <span className="ml-auto text-[var(--color-text-muted)]">{formatDateTime(p.decided_at || p.created_at)}</span>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>}
      </div>
    </div>
  );
}
