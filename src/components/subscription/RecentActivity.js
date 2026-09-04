"use client";

import { statusMeta } from "@/components/subscription/statusMeta";

// Previously hardcoded its own 5-entry status->icon/label map (approved/
// rejected/pending/unpaid/resubmission_requested only) — a purchase in any
// of the other 3 real states (expired/cancelled/refunded) rendered a blank
// icon and "undefined" in place of the status phrase. Now reads the same
// complete, real status list every other billing component uses.
const STATUS_PHRASE = {
  approved: "approved",
  rejected: "rejected",
  pending: "submitted, awaiting review",
  unpaid: "created, awaiting payment",
  resubmission_requested: "sent back for new proof",
  expired: "expired before payment was completed",
  cancelled: "cancelled",
  refunded: "refunded",
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
        {events.map((p) => {
          const meta = statusMeta(p.status);
          return (
            <div key={p.id} className="flex items-center gap-2 text-xs">
              <meta.Icon className={`h-3.5 w-3.5 flex-none ${meta.iconClassName}`} />
              <span className="text-[var(--color-text)]">
                {p.kind === "grand_test" ? p.grand_test_title : p.plan_name} purchase {STATUS_PHRASE[p.status] || p.status}
              </span>
              <span className="ml-auto flex-none text-[var(--color-text-muted)]">{formatDateTime(p.decided_at || p.created_at)}</span>
            </div>
          );
        })}
        {events.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>}
      </div>
    </div>
  );
}
