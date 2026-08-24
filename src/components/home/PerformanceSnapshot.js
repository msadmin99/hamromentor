"use client";

import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import RadialProgress from "./RadialProgress";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PerformanceSnapshot({ kpis, trend }) {
  if (!kpis) return null;

  const weekly = (trend || []).slice(-7).map((t) => ({
    ...t,
    day: WEEKDAY[new Date(t.date).getDay()],
  }));
  const hasTrendData = weekly.some((w) => w.avg_accuracy != null && w.attempts > 0);

  return (
    <div className="hm-card p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Track. Analyze. Improve.</p>
          <p className="mt-1 max-w-xs text-xs text-[var(--color-text-muted)]">
            Detailed performance reports to help you identify strengths and weaknesses.
          </p>
          <Link
            href="/performance"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            View Performance <span aria-hidden="true">→</span>
          </Link>

          <div className="mt-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Weekly Performance</p>
            <div className="h-28 w-full sm:w-64">
              {hasTrendData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="avg_accuracy" stroke="var(--color-brand-blue)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center text-xs text-[var(--color-text-muted)]">
                  Attempt a few tests this week to see your trend.
                </p>
              )}
            </div>
          </div>
        </div>

        <RadialProgress percent={kpis.overall_accuracy} size={104} strokeWidth={10}>
          <div className="text-center">
            <p className="text-xl font-extrabold text-[var(--color-text)]">{kpis.overall_accuracy}%</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Score</p>
          </div>
        </RadialProgress>

        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">📝</span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[var(--color-text)]">{kpis.questions_attempted}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Questions Attempted</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🎯</span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[var(--color-text)]">{kpis.overall_accuracy}%</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Accuracy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true">📊</span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-[var(--color-text)]">{kpis.total_attempts}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Tests Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
