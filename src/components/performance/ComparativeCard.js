"use client";

function Row({ label, score, accuracy, highlight }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${highlight ? "bg-brand-blue/5" : ""}`}>
      <span className="text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm font-bold text-[var(--color-text)]">
        {score}
        {accuracy != null && <span className="font-normal text-[var(--color-text-muted)]"> ({accuracy}%)</span>}
      </span>
    </div>
  );
}

export default function ComparativeCard({ comparative, testTitle }) {
  if (!comparative) return null;

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Comparative — {testTitle}</p>
      {comparative.is_best_attempt && (
        <p className="mt-1 text-xs font-semibold text-brand-green">🎉 This is your best attempt on this test!</p>
      )}
      <div className="mt-3 flex flex-col divide-y divide-[var(--color-border)]">
        <Row label="This attempt" score={comparative.current.score} accuracy={comparative.current.accuracy} highlight />
        {comparative.previous_attempt && (
          <Row label="Previous attempt" score={comparative.previous_attempt.score} accuracy={comparative.previous_attempt.accuracy} />
        )}
        {comparative.best_attempt && !comparative.is_best_attempt && (
          <Row label="Your best attempt" score={comparative.best_attempt.score} accuracy={comparative.best_attempt.accuracy} />
        )}
        {comparative.test_average_score != null && (
          <Row label="Test average (all students)" score={comparative.test_average_score} accuracy={null} />
        )}
      </div>
    </div>
  );
}
