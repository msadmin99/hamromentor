"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** TEMPORARY, INVESTIGATION-ONLY instrumentation for the QBank mobile
 * blank-content bug. Not wired into normal navigation — only mounts when
 * the URL has ?debug=1 (see qbank/page.js), so a real student visiting
 * /qbank normally never renders, imports, or pays any cost for this file.
 * Intended to be deleted once the root cause is found. Does not touch any
 * other component's source — every measurement here reads the DOM from
 * outside (by class/text, not by requiring new data-attributes elsewhere)
 * and every experiment variant is a scoped CSS override injected from
 * here, so AppShell/Header/ProgressSummary/etc. stay byte-for-byte
 * unmodified regardless of which toggles are active.
 *
 * Provides, all from the phone alone, no cable/computer needed:
 *  - Phase 2 geometry: live scroll/viewport metrics + getBoundingClientRect()
 *    for the named elements, snapshotted on every scroll + layout-shift event.
 *  - A real PerformanceObserver('layout-shift') feed — the actual browser
 *    API measuring Cumulative Layout Shift.
 *  - A requestAnimationFrame jank detector (frame-to-frame gaps > 50ms).
 *  - Phase 4 one-variable toggles, applied as scoped CSS via data
 *    attributes on <html>.
 *  - Phase 5: a toggle that blocks interaction until QBank's three async
 *    fetches (subjects, dashboard stats, recommended) have all resolved.
 *  - Phase 6: rich DOM identification for every layout-shift source node,
 *    a standalone geometry scanner for the recurring "303-359px tall, top
 *    383-439px" pattern, and MARK BLANK START/END buttons.
 *
 * PHASE 7 (this revision) — self-contamination fix. A real-device JSON
 * export showed the recurring 303<->359 / 383<->439 pattern was traced
 * directly to THIS PANEL ITSELF: its own text ("QBank Scroll Diagnostics
 * (?debug=1) ... MARK BLANK START ...") turned up as the geometry-scan
 * candidate. Root cause: `findGeometryMatches()` swept
 * `scrollEl.querySelectorAll('div, section')`, and this component is
 * rendered as a DOM *child* of that same scroll container in
 * qbank/page.js — its own `position: fixed` removes it from layout flow
 * (it never affects the scroll container's scrollHeight/content position)
 * but does NOT remove it from a `querySelectorAll` sweep of that
 * container's descendants, so it was eligible to match its own tolerance
 * band. Its height legitimately does move in that same 300-360px range
 * (content grows/shrinks as log entries and MARK buttons render, `bottom:
 * 0` + variable height ⇒ variable `top`), so once it was in the candidate
 * pool it was a very good match. This revision fixes it three ways,
 * layered (any one alone would have been enough, together they make the
 * exclusion robust rather than reliant on a single mechanism):
 *   1. `data-qbank-debug-overlay` marks the panel root; every scanner
 *      (geometry scanner, findTargets, layout-shift source processing)
 *      explicitly excludes the root and all descendants via
 *      `el.closest('[data-qbank-debug-overlay]')` — never by text match.
 *   2. The panel is rendered through a React portal directly onto
 *      `document.body`, so it is no longer a DOM descendant of the QBank
 *      scroll container (or of QBank at all) — structurally, not just by
 *      filter.
 *   3. The panel's own on-screen height is now fixed (not content-driven
 *      `maxHeight: auto`), so it can no longer generate genuine
 *      self-inflicted layout shifts as its log grows, independent of the
 *      exclusion logic above.
 * The original "MASTER ENGINEERING TASK" report's 303/359 evidence used
 * the identical numbers reported here — it was very likely this same
 * panel the whole time, not a QBank component. Recorded honestly, not
 * glossed over: see the final report for what that does and doesn't mean
 * for the stage 4 NextPracticeCard/SubjectGrid fixes (those were
 * evidenced independently, from source code, not from this pattern).
 *
 *  - Export: every captured event is appended to an in-memory log with a
 *    "Copy JSON" button, since there is no server to stream telemetry to
 *    from here - you copy/paste or screenshot the log back for analysis. */

const DEBUG_OVERLAY_SELECTOR = "[data-qbank-debug-overlay]";

function isDebugOverlayNode(el) {
  return !!el && typeof el.closest === "function" && !!el.closest(DEBUG_OVERLAY_SELECTOR);
}

const TARGETS = [
  { key: "scrollContainer", match: (el) => el.classList?.contains("overflow-y-auto") && el.classList?.contains("hm-scrollbar-none") },
  { key: "pageRoot", match: (el) => el.classList?.contains("hm-page") },
  { key: "header", match: (el) => el.tagName === "HEADER" },
  { key: "bottomNav", match: (el) => el.tagName === "NAV" && el.getAttribute("aria-label") === "Primary navigation" },
  // QBank 2.0: QBankHero's headline copy changed to "Let's make progress
  // today." (Qbank12.png) — updated here so this diagnostic's target
  // matcher doesn't silently go stale.
  { key: "qbankHero", match: (el) => el.textContent?.includes("Let's make progress today.") },
  // QBank 2.0 visual QA: label copy changed to "Your Next Best Action"
  // (Qbank12.png) — updated here so this diagnostic's target matcher
  // doesn't silently go stale.
  { key: "nextPracticeCard", match: (el) => el.textContent?.includes("Your Next Best Action") && el.classList?.contains("hm-card") },
  { key: "progressSummary", match: (el) => el.textContent?.trim().startsWith("Your Progress") && el.classList?.contains("hm-card") },
  { key: "recommendedForYou", match: (el) => el.textContent?.trim().startsWith("Recommended for You") },
  { key: "subjectGrid", match: (el) => el.id === "subjects" },
  { key: "quickPractice", match: (el) => el.textContent?.includes("Quick Practice") && el.textContent?.includes("Practice a few questions anytime") },
  // ChapterGrid/ChapterHero deliberately not matched here — they render
  // on /qbank/[subjectSlug], not on this page; this instrumentation only
  // ever mounts on qbank/page.js (see the ?debug=1 gate there), so a
  // matcher for them would only ever resolve to null and isn't included
  // rather than fabricate a guess at their markup.
];

function findTargets() {
  const found = {};
  const all = document.querySelectorAll("div, section, header, nav");
  for (const el of all) {
    if (isDebugOverlayNode(el)) continue;
    for (const t of TARGETS) {
      if (!found[t.key] && t.match(el)) found[t.key] = el;
    }
  }
  return found;
}

function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width),
    visibility: cs.visibility, display: cs.display, opacity: cs.opacity,
  };
}

// --- Phase 6: rich node identification --------------------------------
function shortText(el, limit = 120) {
  const t = el?.textContent?.trim().replace(/\s+/g, " ") || "";
  return t.length > limit ? `${t.slice(0, limit)}…` : t;
}

function tagClass(el) {
  if (!el) return null;
  return { tag: el.tagName, className: typeof el.className === "string" ? el.className : null };
}

function nearestSection(el) {
  let cur = el?.parentElement;
  while (cur && cur !== document.body) {
    if (cur.tagName === "SECTION" || cur.classList?.contains("hm-card")) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function nearestNamedAncestor(el) {
  let cur = el?.parentElement;
  let hops = 0;
  while (cur && cur !== document.body && hops < 8) {
    if (typeof cur.className === "string" && cur.className.trim()) return cur;
    cur = cur.parentElement;
    hops += 1;
  }
  return null;
}

function describeNode(el) {
  if (!el || typeof el.getBoundingClientRect !== "function") return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const section = nearestSection(el);
  const named = nearestNamedAncestor(el);
  return {
    tag: el.tagName,
    id: el.id || null,
    className: typeof el.className === "string" ? el.className : null,
    testId: el.getAttribute?.("data-testid") || null,
    ariaLabel: el.getAttribute?.("aria-label") || null,
    role: el.getAttribute?.("role") || null,
    name: el.getAttribute?.("aria-label") || el.getAttribute?.("title") || el.getAttribute?.("name") || null,
    text: shortText(el),
    innerHtmlSig: (el.innerHTML || "").slice(0, 80),
    parent: tagClass(el.parentElement),
    grandparent: tagClass(el.parentElement?.parentElement),
    nearestSection: section ? { ...tagClass(section), text: shortText(section, 60) } : null,
    nearestNamedAncestor: named && named !== section ? tagClass(named) : null,
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    style: {
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity, overflow: cs.overflow,
      position: cs.position, transform: cs.transform, filter: cs.filter, willChange: cs.willChange,
      zIndex: cs.zIndex, background: cs.backgroundColor,
    },
  };
}

// Item 3 (Phase 6) / re-scoped in Phase 7 to explicitly exclude the debug
// overlay itself — see the docstring's contamination writeup above. Scans
// the scroll container (not the whole document, to keep this cheap enough
// to run every scroll tick on a real phone) for any element whose rect
// falls near the reported pattern, +/-~16px tolerance.
const GEOMETRY_WATCH = { heightMin: 273, heightMax: 389, topMin: 353, topMax: 469 };

function findGeometryMatches(scrollEl) {
  const root = scrollEl || document;
  const all = root.querySelectorAll("div, section");
  const matches = [];
  for (const el of all) {
    if (isDebugOverlayNode(el)) continue;
    const r = el.getBoundingClientRect();
    if (
      r.height >= GEOMETRY_WATCH.heightMin && r.height <= GEOMETRY_WATCH.heightMax &&
      r.top >= GEOMETRY_WATCH.topMin && r.top <= GEOMETRY_WATCH.topMax
    ) {
      matches.push(describeNode(el));
      if (matches.length >= 5) break;
    }
  }
  return matches;
}

// Phase 7, item 6: the initial "mount" snapshot could race the very first
// paint and misreport a real (about-to-be-measurable) scroll container as
// scrollHeight:0/clientHeight:0 — not a valid geometry reading, just an
// unsettled one. `measurementUnavailable` makes that distinction explicit
// instead of letting a literal 0 be read as real data, for every
// snapshot, not only the first.
function snapshot(scrollEl, reason) {
  const t = findTargets();
  const scrollHeight = scrollEl ? scrollEl.scrollHeight : null;
  const clientHeight = scrollEl ? scrollEl.clientHeight : null;
  const measurementUnavailable = !!scrollEl && scrollHeight === 0 && clientHeight === 0;
  return {
    t: Math.round(performance.now()),
    reason,
    innerHeight: window.innerHeight,
    docClientHeight: document.documentElement.clientHeight,
    visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
    scrollTop: scrollEl ? Math.round(scrollEl.scrollTop) : null,
    scrollHeight,
    clientHeight,
    measurementUnavailable,
    rects: Object.fromEntries(Object.entries(t).map(([k, el]) => [k, rect(el)])),
  };
}

const VARIANTS = [
  { key: "noBlobs", label: "A. Hide decorative blur blobs" },
  { key: "noOverflow", label: "B. Remove card overflow-hidden" },
  { key: "noShadow", label: "C. Remove card shadows" },
  { key: "noHover", label: "D. Remove hover transforms/transitions" },
  { key: "noSvg", label: "E. Hide AccuracyRing SVG" },
  { key: "flatCards", label: "F. Plain rectangular cards" },
  { key: "noBlur", label: "G. Disable BottomNav blur" },
  { key: "noHeaderFx", label: "H. Disable Header gradient/shadow" },
];

const VARIANT_CSS = {
  noBlobs: `[data-diag-noBlobs] .hm-card > span[class*="opacity-"] { display: none !important; }`,
  noOverflow: `[data-diag-noOverflow] .hm-card { overflow: visible !important; }`,
  noShadow: `[data-diag-noShadow] .hm-card, [data-diag-noShadow] .hm-card:hover { box-shadow: none !important; }`,
  noHover: `[data-diag-noHover] .hm-card { transition: none !important; transform: none !important; }`,
  noSvg: `[data-diag-noSvg] svg { display: none !important; }`,
  flatCards: `[data-diag-flatCards] .hm-card { border-radius: 0 !important; border: none !important; }`,
  noBlur: `[data-diag-noBlur] nav[aria-label="Primary navigation"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: white !important; }`,
  noHeaderFx: `[data-diag-noHeaderFx] .hm-header-gradient { background: #1a4d5c !important; box-shadow: none !important; }`,
};

// Phase 7, item 4: fixed (not content-driven) panel dimensions per mode,
// so the panel's own log growing (Copy JSON (6) -> (7), more log rows,
// longer JSON in a source dump, etc.) can never change its own height —
// which is exactly the self-inflicted-shift mechanism this revision
// exists to eliminate. `maxHeight: auto` previously let content dictate
// height; a fixed `height` with internal scrolling does not.
const PANEL_HEIGHT_EXPANDED = "45vh";
const PANEL_HEIGHT_MINIMIZED = 44;

export default function ScrollDiagnostics({ dataReady, preload, onTogglePreload }) {
  const [log, setLog] = useState([]);
  const [variants, setVariants] = useState({});
  const [minimized, setMinimized] = useState(false);
  // Phase 7, item 2/3: portal the panel directly onto document.body so it
  // is structurally never a DOM descendant of the QBank scroll container
  // (or of QBank at all) — not just filtered out by attribute, actually
  // moved out of that subtree. `mounted` avoids an SSR/hydration mismatch
  // from calling createPortal before document.body exists; a lazy
  // initializer (not an effect) so no setState-in-effect is needed —
  // /qbank is fully static-prerendered, so this component's render code
  // never executes during any server pass in the first place (debugMode
  // is only ever true client-side, after hydration, once ?debug=1's
  // search param is read), meaning `document` is always defined by the
  // time this actually runs.
  const [mounted] = useState(() => typeof document !== "undefined");
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastGeomScanRef = useRef(0);
  const seenShiftsRef = useRef(new Set());
  const logRef = useRef([]);

  function push(entry) {
    logRef.current = [...logRef.current.slice(-199), entry];
    setLog(logRef.current);
  }

  function scrollElement() {
    return document.querySelector(".hm-scrollbar-none.overflow-y-auto");
  }

  // Real Cumulative-Layout-Shift observer. Phase 7: every source whose
  // node is the debug overlay itself or a descendant of it is dropped
  // before it ever reaches the log — never merely tagged, per the
  // explicit instruction that the JSON must not contain the overlay's own
  // text as a "source" at all. If EVERY source for a given entry turns
  // out to be the overlay, the entry is kept (so the observer's raw
  // activity stays auditable) but flagged `debugOverlayOnly: true` and
  // excluded from the QBank-relevant shift count shown in the UI.
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return undefined;
    let po;
    try {
      po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const sig = `${entry.startTime}:${entry.value}`;
          if (seenShiftsRef.current.has(sig)) continue;
          seenShiftsRef.current.add(sig);
          const rawSources = entry.sources || [];
          const sources = rawSources
            .filter((s) => !s.node || !isDebugOverlayNode(s.node))
            .slice(0, 8)
            .map((s) => {
              const prev = s.previousRect && { top: s.previousRect.top, height: s.previousRect.height };
              const cur = s.currentRect && { top: s.currentRect.top, height: s.currentRect.height };
              const changed = !!(prev && cur && (Math.abs(prev.top - cur.top) > 0.5 || Math.abs(prev.height - cur.height) > 0.5));
              return {
                node: s.node ? describeNode(s.node) : { nodeAvailable: false, note: "node no longer attached at attribution time" },
                prev, cur, changed,
              };
            });
          push({
            kind: "layout-shift",
            t: Math.round(entry.startTime),
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
            debugOverlayOnly: rawSources.length > 0 && sources.length === 0,
            excludedOverlaySourceCount: rawSources.length - sources.length,
            sources,
          });
        }
      });
      po.observe({ type: "layout-shift", buffered: true });
    } catch {
      // layout-shift not supported on this browser - not fatal, other signals still work
    }
    return () => po && po.disconnect();
  }, []);

  // rAF jank detector + throttled geometry scanner (item 3).
  useEffect(() => {
    lastFrameRef.current = performance.now();
    function tick(now) {
      const gap = now - lastFrameRef.current;
      if (gap > 50) {
        push({ kind: "jank", t: Math.round(now), gapMs: Math.round(gap) });
      }
      lastFrameRef.current = now;
      if (now - lastGeomScanRef.current > 400) {
        lastGeomScanRef.current = now;
        const matches = findGeometryMatches(scrollElement());
        if (matches.length) {
          push({ kind: "geometry-scan", t: Math.round(now), matches });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Phase 7, item 6: the mount snapshot now waits two animation frames
  // before capturing, so it isn't racing the very first paint, and flags
  // (rather than silently reports) a still-zero measurement afterward.
  useEffect(() => {
    let cancelled = false;
    const scrollEl = scrollElement();
    let raf1 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => {
        if (!cancelled) push(snapshot(scrollEl, "mount"));
      });
    });
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        push(snapshot(scrollEl, "scroll"));
        ticking = false;
      });
    }
    scrollEl?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      scrollEl?.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Apply Phase 4 variant toggles as data-attributes on <html> + inject
  // their scoped CSS once. Toggling is instant and reversible - no reload.
  useEffect(() => {
    const styleId = "qbank-diag-variant-css";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = Object.values(VARIANT_CSS).join("\n");
      document.head.appendChild(style);
    }
    for (const v of VARIANTS) {
      const attr = `data-diag-${v.key}`;
      if (variants[v.key]) document.documentElement.setAttribute(attr, "1");
      else document.documentElement.removeAttribute(attr);
    }
  }, [variants]);

  function toggleVariant(key) {
    setVariants((v) => ({ ...v, [key]: !v[key] }));
  }

  // Item 8: captures the named QBank elements only (findTargets() already
  // excludes the debug overlay structurally) with full rect + style detail
  // (display/visibility/opacity/position/transform/filter/willChange/
  // overflow/zIndex/background) via describeNode(), plus an unthrottled,
  // overlay-excluded geometry scan and the last ~3s of shift/jank history.
  function markBlank(edge) {
    const scrollEl = scrollElement();
    const base = snapshot(scrollEl, `blank-${edge}`);
    const targets = findTargets();
    const targetDetails = Object.fromEntries(Object.entries(targets).map(([k, el]) => [k, describeNode(el)]));
    const recentWindow = 3000;
    push({
      kind: `blank-${edge}`,
      ...base,
      targetDetails,
      geometryMatches: findGeometryMatches(scrollEl),
      activeVariants: { ...variants },
      recentShifts: logRef.current.filter((e) => e.kind === "layout-shift" && base.t - e.t <= recentWindow && base.t - e.t >= -200),
      recentJank: logRef.current.filter((e) => e.kind === "jank" && base.t - e.t <= recentWindow && base.t - e.t >= -200),
    });
  }

  function copyLog() {
    const payload = JSON.stringify({ log: logRef.current, activeVariants: variants, dataReady, ua: navigator.userAgent }, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {});
  }

  const lastSnapshot = [...log].reverse().find((e) => e.kind === undefined || e.reason);
  const qbankShiftEvents = log.filter((e) => e.kind === "layout-shift" && !e.debugOverlayOnly);
  const overlayOnlyShiftCount = log.filter((e) => e.kind === "layout-shift" && e.debugOverlayOnly).length;
  const jankCount = log.filter((e) => e.kind === "jank").length;
  const geomMatchCount = log.filter((e) => e.kind === "geometry-scan").length;

  if (!mounted) return null;

  return createPortal(
    <div
      data-qbank-debug-overlay="true"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 999999,
        height: minimized ? PANEL_HEIGHT_MINIMIZED : PANEL_HEIGHT_EXPANDED, overflowY: "auto",
        background: "rgba(10,14,20,0.94)", color: "#d6ffb3", fontFamily: "monospace",
        fontSize: 11, padding: 8, borderTop: "2px solid #4ade80", boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong style={{ color: "#fff" }}>QBank Scroll Diagnostics (?debug=1)</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={copyLog} style={{ background: "#334", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px" }}>
            Copy JSON ({log.length})
          </button>
          <button onClick={() => setMinimized((m) => !m)} style={{ background: "#334", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px" }}>
            {minimized ? "Expand" : "Minimize"}
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => markBlank("start")}
              style={{ flex: 1, background: "#7f1d1d", color: "#fff", border: "2px solid #fca5a5", borderRadius: 8, padding: "12px 8px", fontSize: 13, fontWeight: "bold" }}
            >
              MARK BLANK START
            </button>
            <button
              onClick={() => markBlank("end")}
              style={{ flex: 1, background: "#14532d", color: "#fff", border: "2px solid #86efac", borderRadius: 8, padding: "12px 8px", fontSize: 13, fontWeight: "bold" }}
            >
              MARK BLANK END
            </button>
          </div>

          <div style={{ marginBottom: 6 }}>
            data ready: {String(dataReady)} · QBank layout-shift events: {qbankShiftEvents.length} (+{overlayOnlyShiftCount} overlay-only, excluded) · jank frames(&gt;50ms): {jankCount} · geometry-scan hits: {geomMatchCount}
            {lastSnapshot && (
              <> · scrollTop={lastSnapshot.scrollTop} scrollHeight={lastSnapshot.scrollHeight}{lastSnapshot.measurementUnavailable ? " (measurementUnavailable)" : ""}</>
            )}
          </div>

          <div style={{ marginBottom: 6 }}>
            <div style={{ color: "#fff", marginBottom: 2 }}>Phase 4 — one variable at a time:</div>
            {VARIANTS.map((v) => (
              <label key={v.key} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 10, marginBottom: 4 }}>
                <input type="checkbox" checked={!!variants[v.key]} onChange={() => toggleVariant(v.key)} />
                {v.label}
              </label>
            ))}
          </div>

          {onTogglePreload && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ color: "#fff", marginBottom: 2 }}>Phase 5 — async timing:</div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!preload} onChange={() => onTogglePreload((p) => !p)} />
                Wait for subjects + dashboard stats before rendering any card (dataReady={String(dataReady)})
              </label>
            </div>
          )}

          <div style={{ maxHeight: "16vh", overflowY: "auto", background: "rgba(0,0,0,0.3)", padding: 4 }}>
            {log.slice(-25).reverse().map((e, i) => (
              <div key={i} style={{ marginBottom: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {e.kind === "layout-shift"
                  ? `[${e.t}ms] SHIFT value=${e.value.toFixed(4)} hadRecentInput=${e.hadRecentInput}${e.debugOverlayOnly ? " DEBUG-OVERLAY-ONLY(excluded)" : ""} sources=${JSON.stringify(e.sources)}`
                  : e.kind === "jank"
                    ? `[${e.t}ms] JANK gap=${e.gapMs}ms`
                    : e.kind === "geometry-scan"
                      ? `[${e.t}ms] GEOM-MATCH ${e.matches.length} candidate(s)=${JSON.stringify(e.matches)}`
                      : e.kind === "blank-start" || e.kind === "blank-end"
                        ? `[${e.t}ms] ${e.kind.toUpperCase()} scrollTop=${e.scrollTop} targets=${JSON.stringify(e.targetDetails)} geomMatches=${JSON.stringify(e.geometryMatches)}`
                        : `[${e.t}ms] ${e.reason} scrollTop=${e.scrollTop}${e.measurementUnavailable ? " measurementUnavailable=true" : ""} rects=${JSON.stringify(e.rects)}`}
              </div>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
