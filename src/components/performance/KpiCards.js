"use client";

import { BoltIcon, CheckCircleIcon, CircleDashedIcon, ClockIcon, EditIcon, FlameIcon, RankIcon, TargetIcon, TrophyIcon, XCircleIcon } from "@/components/icons";

function formatSeconds(seconds) {
  const s = seconds || 0;
  const hours = Math.floor(s / 3600);
  const minutes = Math.round((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Card({ label, value, Icon, tint }) {
  return (
    <div className="hm-card p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-xl font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const cards = [
    { label: "Overall Accuracy", value: `${kpis.overall_accuracy}%`, Icon: TargetIcon, tint: "bg-brand-blue/10 text-brand-blue" },
    { label: "Overall Score", value: kpis.overall_score, Icon: TrophyIcon, tint: "bg-amber-50 text-amber-600" },
    { label: "Questions Attempted", value: kpis.questions_attempted, Icon: EditIcon, tint: "bg-purple-50 text-purple-600" },
    { label: "Correct", value: kpis.questions_correct, Icon: CheckCircleIcon, tint: "bg-green-50 text-green-600" },
    { label: "Incorrect", value: kpis.questions_incorrect, Icon: XCircleIcon, tint: "bg-red-50 text-red-600" },
    { label: "Unanswered", value: kpis.questions_unanswered, Icon: CircleDashedIcon, tint: "bg-gray-50 text-gray-500" },
    { label: "Total Study Time", value: formatSeconds(kpis.total_study_seconds), Icon: ClockIcon, tint: "bg-teal-50 text-teal-600" },
    { label: "Avg Time / Question", value: `${kpis.avg_seconds_per_question}s`, Icon: BoltIcon, tint: "bg-orange-50 text-orange-600" },
    { label: "Current Streak", value: `${kpis.current_streak_days}d`, Icon: FlameIcon, tint: "bg-pink-50 text-pink-600" },
    { label: "Longest Streak", value: `${kpis.longest_streak_days}d`, Icon: RankIcon, tint: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}
