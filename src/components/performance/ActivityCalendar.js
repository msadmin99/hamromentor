"use client";

import Link from "next/link";

const DOT_META = [
  { key: "quiz", label: "Quiz/Exam", color: "bg-brand-blue" },
  { key: "mock", label: "Mock Test", color: "bg-purple-500" },
  { key: "practice", label: "QBank Practice", color: "bg-brand-green" },
  { key: "video", label: "Video", color: "bg-amber-500" },
];

function pad(n) {
  return String(n).length < 2 ? `0${n}` : String(n);
}

export default function ActivityCalendar({ month, onMonthChange, calendar, loading }) {
  const [year, mon] = month.split("-").map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shiftMonth(delta) {
    const next = new Date(year, mon - 1 + delta, 1);
    onMonthChange(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
  }

  const upcoming = calendar?.upcoming_exams || [];

  return (
    <div className="hm-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-text)]">Activity Calendar</p>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs">
            ‹
          </button>
          <span className="text-xs font-semibold text-[var(--color-text)]">
            {firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => shiftMonth(1)} className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs">
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--color-text-muted)]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateKey = `${year}-${pad(mon)}-${pad(d)}`;
              const activity = calendar?.days?.[dateKey];
              return (
                <div key={i} className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] p-1.5">
                  <span className="text-[11px] text-[var(--color-text)]">{d}</span>
                  <div className="flex gap-0.5">
                    {DOT_META.filter((m) => activity?.[m.key]).map((m) => (
                      <span key={m.key} className={`h-1.5 w-1.5 rounded-full ${m.color}`} title={m.label} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--color-text-muted)]">
            {DOT_META.map((m) => (
              <span key={m.key} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${m.color}`} /> {m.label}
              </span>
            ))}
          </div>

          {upcoming.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Upcoming Exams</p>
              <div className="flex flex-col gap-1.5">
                {upcoming.map((e) => (
                  <Link key={e.test_id} href={`/tests/${e.test_id}`} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text)]">{e.title}</span>
                    <span className="text-[var(--color-text-muted)]">{e.date}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
