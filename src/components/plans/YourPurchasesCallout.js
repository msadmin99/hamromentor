import Link from "next/link";

export default function YourPurchasesCallout() {
  return (
    <section className="hm-card p-5 text-center">
      <p className="text-base font-bold text-[var(--color-text)]">Your Subscriptions &amp; Purchases</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        View and manage your active memberships, test bundles and courses.
      </p>
      <div className="mt-4 flex flex-col justify-center gap-2.5 sm:flex-row">
        <Link
          href="/subscriptions"
          className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          View My Subscriptions →
        </Link>
        <Link
          href="/my-courses"
          className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          My Courses →
        </Link>
      </div>
    </section>
  );
}
