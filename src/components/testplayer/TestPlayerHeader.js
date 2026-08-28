"use client";

import { useEffect, useState } from "react";

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

/** Compact sticky header — title, "Question X of Y", answered/remaining
 * counts, a slim progress bar, the timer, and a Fullscreen toggle. `remaining`
 * is owned by the parent (resynced against the server-derived expiry there,
 * not computed here) so this component stays purely presentational. */
export default function TestPlayerHeader({
  title,
  currentQuestionNumber,
  totalQuestions,
  answeredCount,
  remaining,
  onOpenNavigator,
}) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  const remainingPct = totalQuestions ? Math.round(((currentQuestionNumber - 1) / totalQuestions) * 100) : 0;
  const answeredPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isLowTime = remaining != null && remaining <= 300;

  return (
    <header className="hm-header-gradient sticky top-0 z-20 text-white">
      <div className="hm-page !py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onOpenNavigator}
              aria-label="Open question navigator"
              className="flex-none rounded-lg bg-white/10 p-1.5 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <span className="min-w-0 truncate text-sm font-semibold">{title}</span>
          </div>

          <div className="flex flex-none items-center gap-3">
            <span
              className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${isLowTime ? "bg-brand-red text-white" : "bg-black/20"}`}
              aria-live={isLowTime ? "polite" : "off"}
            >
              ⏱ {remaining != null ? formatTime(remaining) : "--:--:--"}
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="hidden rounded-lg bg-white/10 p-1.5 md:block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {fullscreen ? (
                  <path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 1-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <p className="flex-none text-xs text-white/85">
            Question {currentQuestionNumber} of {totalQuestions} · {answeredCount} answered · {totalQuestions - answeredCount} remaining
          </p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.max(remainingPct, answeredPct)}%` }} />
          </div>
          <span className="flex-none text-xs font-bold text-white/85">{answeredPct}%</span>
        </div>
      </div>
    </header>
  );
}
