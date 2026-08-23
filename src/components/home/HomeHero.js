"use client";

export default function HomeHero({ name, onStartTest }) {
  return (
    <div className="hm-card relative overflow-hidden p-5 sm:p-7">
      <span
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10"
        style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-blue) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">Welcome back, {name} 👋</p>
          {/* Header.js already renders the page's <h1> — this is a section heading. */}
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-[var(--color-text)] sm:text-3xl">
            Let&apos;s crack your <span className="text-brand-blue">next exam!</span>
          </h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
            Practice daily, analyze your performance, and improve step by step.
          </p>
          <button
            type="button"
            onClick={onStartTest}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Start a Test
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div
          className="flex h-32 w-32 flex-none items-center justify-center self-center rounded-full text-6xl sm:h-36 sm:w-36"
          style={{ background: "linear-gradient(135deg, var(--color-brand-teal-from) 0%, var(--color-brand-teal-to) 100%)" }}
          aria-hidden="true"
        >
          🎓
        </div>
      </div>
    </div>
  );
}
