const BADGES = [
  { icon: "🔒", label: "Secure Payment" },
  { icon: "✓", label: "Verified Purchase" },
  { icon: "⚡", label: "Fast Activation" },
  { icon: "💬", label: "Student Support" },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BADGES.map((b) => (
        <div key={b.label} className="hm-card flex flex-col items-center gap-1.5 py-4 text-center">
          <span className="text-xl" aria-hidden="true">{b.icon}</span>
          <span className="text-xs font-semibold text-[var(--color-text)]">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
