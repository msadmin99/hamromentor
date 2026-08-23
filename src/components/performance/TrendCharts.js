"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const METRICS = [
  { key: "avg_score", label: "Score" },
  { key: "avg_accuracy", label: "Accuracy" },
  { key: "avg_seconds_per_question", label: "Speed (sec/question)" },
  { key: "avg_rank", label: "Rank" },
  { key: "avg_percentile", label: "Percentile" },
];

export default function TrendCharts({ trend }) {
  const [metric, setMetric] = useState("avg_accuracy");

  const data = (trend || []).map((t) => ({ ...t, [metric]: t[metric] ?? null }));
  const hasData = data.some((d) => d[metric] != null);

  return (
    <div className="hm-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">Performance Trends</p>
        <div className="flex flex-wrap rounded-lg border border-[var(--color-border)] p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                metric === m.key ? "bg-brand-blue text-white" : "text-[var(--color-text-muted)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey={metric} stroke="var(--color-brand-blue)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            Not enough data yet for this metric — attempt more exams to see a trend.
          </p>
        )}
      </div>
    </div>
  );
}
