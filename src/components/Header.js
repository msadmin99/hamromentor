"use client";

import { useRouter } from "next/navigation";

export default function Header({ title, subtitle, showBack = false, right = null, courseSwitcher = null, children = null }) {
  const router = useRouter();

  return (
    <header className="hm-header-gradient sticky top-0 z-20 text-white shadow-sm">
      <div
        className={`relative mx-auto w-full max-w-6xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-10 ${subtitle || courseSwitcher ? "pb-2" : "pb-5"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {showBack && (
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="rounded-full p-2.5 -ml-2.5 hover:bg-white/15 active:bg-white/25 transition sm:p-1 sm:-ml-1"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h1 className="truncate text-[15px] font-semibold md:text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-white/90">{right}</div>
        </div>
        {subtitle && <p className="mt-2 pb-1 text-center text-xs font-medium text-white/85">{subtitle}</p>}
        {courseSwitcher && <div className="mt-2.5 pb-2">{courseSwitcher}</div>}
        {/* Optional, additive decorative slot — absolutely positioned so it
            never affects the layout above (no existing caller passes this,
            so every other page renders identically to before). Used today
            only by the Exams hub's hero mission copy. */}
        {children}
      </div>
    </header>
  );
}
