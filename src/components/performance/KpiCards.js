"use client";

function formatSeconds(seconds) {
  const s = seconds || 0;
  const hours = Math.floor(s / 3600);
  const minutes = Math.round((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Card({ label, value, icon, tint }) {
  return (
    <div className="hm-card p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${tint}`}>{icon}</span>
      <p className="mt-3 text-xl font-extrabold text-[var(--color-text)]">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const cards = [
    { label: "Overall Accuracy", value: `${kpis.overall_accuracy}%`, icon: "🎯", tint: "bg-blue-50" },
    { label: "Overall Score", value: kpis.overall_score, icon: "🏆", tint: "bg-amber-50" },
    { label: "Questions Attempted", value: kpis.questions_attempted, icon: "📝", tint: "bg-purple-50" },
    { label: "Correct", value: kpis.questions_correct, icon: "✅", tint: "bg-green-50" },
    { label: "Incorrect", value: kpis.questions_incorrect, icon: "❌", tint: "bg-red-50" },
    { label: "Unanswered", value: kpis.questions_unanswered, icon: "⭕", tint: "bg-gray-50" },
    { label: "Total Study Time", value: formatSeconds(kpis.total_study_seconds), icon: "⏱️", tint: "bg-teal-50" },
    { label: "Avg Time / Question", value: `${kpis.avg_seconds_per_question}s`, icon: "⚡", tint: "bg-orange-50" },
    { label: "Current Streak", value: `${kpis.current_streak_days}d`, icon: "🔥", tint: "bg-pink-50" },
    { label: "Longest Streak", value: `${kpis.longest_streak_days}d`, icon: "🏅", tint: "bg-indigo-50" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}
