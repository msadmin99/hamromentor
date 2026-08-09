"use client";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function Timeline({ subscriptions, purchases }) {
  const current = subscriptions.filter((s) => s.starts_at || s.expires_at);
  if (current.length === 0) return null;

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Subscription Timeline</p>
      <div className="mt-4 flex flex-col gap-4">
        {current.map((s) => {
          const renewal = purchases.find(
            (p) => p.plan === s.plan && p.status === "approved" && p.decided_at
          );
          return (
            <div key={s.id}>
              <p className="mb-2 text-xs font-semibold text-[var(--color-text)]">
                {s.plan_name || s.product_type} — {s.course_name}
              </p>
              <div className="flex items-center">
                <div className="flex flex-1 flex-col items-start">
                  <span className="h-3 w-3 rounded-full bg-brand-green" />
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Activated</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text)]">{formatDate(s.starts_at)}</p>
                </div>
                <div className="h-0.5 flex-1 bg-[var(--color-border)]" />
                <div className="flex flex-1 flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-brand-blue" />
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Last Renewal</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text)]">
                    {renewal ? formatDate(renewal.decided_at) : "None yet"}
                  </p>
                </div>
                <div className="h-0.5 flex-1 bg-[var(--color-border)]" />
                <div className="flex flex-1 flex-col items-end">
                  <span className={`h-3 w-3 rounded-full ${s.is_current ? "bg-[var(--color-border)]" : "bg-brand-red"}`} />
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Expiry</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text)]">{formatDate(s.expires_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
