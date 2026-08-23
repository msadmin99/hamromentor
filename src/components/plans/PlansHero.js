export default function PlansHero() {
  return (
    <div className="hm-card relative overflow-hidden p-5 text-center sm:p-8">
      <span
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10"
        style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
        aria-hidden="true"
      />
      <p className="relative text-xs font-bold uppercase tracking-wide text-brand-blue">Dr. Gutka Membership &amp; Store</p>
      {/* Header.js already renders the page's <h1> — this is a section heading. */}
      <h2 className="relative mt-2 text-2xl font-extrabold leading-tight text-[var(--color-text)] sm:text-3xl">
        What should you purchase?
      </h2>
      <p className="relative mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Practice memberships, test bundles, single tests and video courses — priced and purchased separately,
        so you only ever pay for what you actually need.
      </p>
    </div>
  );
}
