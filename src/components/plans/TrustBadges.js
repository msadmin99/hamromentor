import { CheckCircleIcon, ClockIcon, HelpCircleIcon, LockIcon } from "@/components/icons";

const BADGES = [
  { Icon: LockIcon, label: "Secure Payment" },
  { Icon: CheckCircleIcon, label: "Verified Purchase" },
  { Icon: ClockIcon, label: "Fast Activation" },
  { Icon: HelpCircleIcon, label: "Student Support" },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BADGES.map((b) => (
        <div key={b.label} className="hm-card flex flex-col items-center gap-1.5 py-4 text-center">
          <b.Icon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
          <span className="text-xs font-semibold text-[var(--color-text)]">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
