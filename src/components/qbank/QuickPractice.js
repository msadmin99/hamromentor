"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// ~1 question/minute — matches the reference design's own "10 min -> ~10 Qs"
// ratio. Purely a display estimate; the practice-session endpoint sizes the
// actual set from real available/difficulty-adjusted questions, not this count.
const PRESETS = [5, 10, 20, 30];

export default function QuickPractice() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(10);
  const [custom, setCustom] = useState("");
  const isCustom = !PRESETS.includes(minutes);

  function start() {
    const m = isCustom ? Number(custom) || 10 : minutes;
    // Both params: `time` sets the countdown (existing Practice Builder
    // setting), `count` sizes the session to roughly match — the builder
    // treats them as independent settings, so Quick Practice sets both to
    // actually deliver "N min -> ~N questions."
    router.push(`/qbank/practice?time=${m}&count=${m}&auto=1`);
  }

  return (
    <section className="hm-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text)]">
            <span aria-hidden="true">⏱</span> Quick Practice
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Practice a few questions anytime</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(m)}
              aria-pressed={minutes === m}
              className={`rounded-xl border px-3 py-2 text-center text-xs font-bold transition ${
                minutes === m ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text)]"
              }`}
            >
              <div>{m} min</div>
              <div className="font-normal text-[var(--color-text-muted)]">~{m} Qs</div>
            </button>
          ))}
          <label className="flex flex-col">
            <span className="sr-only">Custom minutes</span>
            <input
              type="number"
              min={1}
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setMinutes(Number(e.target.value) || 0);
              }}
              placeholder="Custom"
              className={`w-20 rounded-xl border px-2 py-2 text-center text-xs font-bold ${
                isCustom && custom ? "border-brand-blue text-brand-blue" : "border-[var(--color-border)] text-[var(--color-text)]"
              }`}
            />
          </label>

          <button
            type="button"
            onClick={start}
            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Start {isCustom ? custom || "" : minutes}-Minute Practice
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
