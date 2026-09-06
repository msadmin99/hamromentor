"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * PRODUCTION INCIDENT (Daily Test white screen): this route had zero error
 * boundaries anywhere in the app before this file — confirmed by a full
 * search for error.js/global-error.js across the whole app. Any uncaught
 * render exception in the exam player (AttemptContent, QuestionWorkspace,
 * TestPlayerHeader, etc.) had nothing to catch it, so React unmounted the
 * tree with no fallback: a completely blank page, exactly the "exam screen
 * automatically becomes completely white" symptom.
 *
 * This is Next.js App Router's own error-boundary convention (a Client
 * Component default-exporting a component that receives {error, reset}),
 * scoped to this one route segment so a crash here can never blank out the
 * rest of the app.
 *
 * `reset()` re-renders this segment from scratch, which re-runs
 * AttemptContent's mount effect — that effect only ever calls
 * `GET /attempts/{id}/` (load()), never `POST /tests/{id}/start/`, so
 * retrying here can never create a duplicate attempt. The existing
 * attempt (and every answer already saved server-side) is untouched by
 * this failing the first time and this component doesn't touch
 * localStorage/sessionStorage, so there's nothing stale to clear either.
 */
export default function AttemptError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error("Daily Test exam player crashed:", error);
  }, [error]);

  return (
    <div className="hm-app-shell flex items-center justify-center p-6">
      <div className="hm-card w-full max-w-sm p-5 text-center">
        <p className="text-sm font-bold text-[var(--color-text)]">Something went wrong loading this exam.</p>
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          Your attempt and any answers you already saved are still there — this only affected the display.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {/* reset() re-renders this segment from scratch — it re-runs
              load() (GET /attempts/{id}/ only), never POST .../start/, so
              this can never create a duplicate attempt. */}
          <button type="button" onClick={() => reset()} className="min-h-[44px] rounded-xl bg-brand-blue text-sm font-bold text-white">
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.push("/daily-test")}
            className="min-h-[44px] rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]"
          >
            Back to Daily Tests
          </button>
        </div>
      </div>
    </div>
  );
}
