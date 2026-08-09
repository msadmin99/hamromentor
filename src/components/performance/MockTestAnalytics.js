"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function Stat({ label, value }) {
  return (
    <div className="hm-card p-3">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export default function MockTestAnalytics({ mockTests }) {
  if (!mockTests) return null;

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Mock Test Analytics</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Total Taken" value={mockTests.total_taken} />
        <Stat label="Average Score" value={mockTests.avg_score} />
        <Stat label="Best Score" value={mockTests.best_score} />
        <Stat label="Worst Score" value={mockTests.worst_score} />
      </div>

      <div className="mt-4 h-56">
        {mockTests.trend.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTests.trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, _n, p) => [v, p.payload.test_title]} />
              <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            Take your first Mock Test to see your improvement trend here.
          </p>
        )}
      </div>
    </div>
  );
}
