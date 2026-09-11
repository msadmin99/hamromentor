"use client";

import { useEffect, useRef, useState } from "react";

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
 *    API measuring Cumulative Layout Shift — which answers Phase 2's A-vs-B
 *    question directly: if a shift is reported for a given blank episode,
 *    the browser's own layout genuinely moved; if no shift is reported
 *    while the user reports a blank area, layout stayed put and it's a
 *    pure paint/composite failure instead.
 *  - A requestAnimationFrame jank detector (frame-to-frame gaps > 50ms),
 *    a rough proxy for "the main thread stalled" / "a frame was dropped",
 *    since a full DevTools Performance timeline isn't available right now.
 *  - Phase 4 one-variable toggles, applied as scoped CSS via data
 *    attributes on <html> - every toggle is independent and reversible at
 *    runtime, so one deploy covers all eight variants without needing
 *    eight separate builds.
 *  - Phase 5: a toggle that blocks interaction until QBank's three async
 *    fetches (subjects, dashboard stats, recommended) have all resolved,
 *    directly testing whether the bug needs mid-scroll async insertion.
 *  - Phase 6 (this revision): rich DOM identification for every
 *    layout-shift source node (tag/id/class/testid/aria-label/role/text/
 *    parent+grandparent/nearest section/computed style), a standalone
 *    geometry scanner that searches the scroll container for any element
 *    whose rect falls near the recurring "303-359px tall, top 383-439px"
 *    pattern reported from real-device testing (independent of whether
 *    PerformanceObserver attributed a shift to it — a real, documented
 *    Chrome limitation is that `LayoutShiftAttribution.node` can be null
 *    once the node has moved/been replaced by the time attribution is
 *    read), and MARK BLANK START / MARK BLANK END buttons that force an
 *    immediate, detailed capture (including the layout-vs-paint style
 *    fields: transform/filter/will-change/opacity/overflow/position/
 *    z-index/background) so the geometry data can be correlated against
 *    exactly when the user sees the blank area, not just against scroll
 *    events in general.
 *  - Export: every captured event is appended to an in-memory log with a
 *    "Copy JSON" button, since there is no server to stream telemetry to
 *    from here - you copy/paste or screenshot the log back for analysis. */

const TARGETS = [
  { key: "scrollContainer", match: (el) => el.classList?.contains("overflow-y-auto") && el.classList?.contains("hm-scrollbar-none") },
  { key: "header", match: (el) => el.tagName === "HEADER" },
  { key: "bottomNav", match: (el) => el.tagName === "NAV" && el.getAttribute("aria-label") === "Primary navigation" },
  { key: "progressSummary", match: (el) => el.textContent?.trim().startsWith("Your Progress") && el.classList?.contains("hm-card") },
  { key: "recommendedForYou", match: (el) => el.textContent?.trim().startsWith("Recommended for You") },
  { key: "quickPractice", match: (el) => el.textContent?.includes("Quick Practice") && el.textContent?.includes("Practice a few questions anytime") },
];

function findTargets() {
  const found = {};
  const all = document.querySelectorAll("div, section, header, nav");
  for (const el of all) {
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
// Item 1/2 of the follow-up investigation: a PerformanceObserver source
// previously only reported `node.className || node.tagName`, which is
// exactly why every prior source came back as an anonymous "DIV". This
// walks the real node (when still attached — see the docstring above for
// why it sometimes won't be) and records everything asked for: tag, id,
// class, data-testid, aria-label, role, an accessible "name" best-effort,
// short text, parent/grandparent, nearest <section>/.hm-card ancestor,
// nearest ancestor with any non-empty className, full rect, and the
// layout-vs-paint style fields (transform/filter/will-change/opacity/
// overflow/position/z-index/background).
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

// Item 3: an independent scanner, not dependent on PerformanceObserver
// attribution at all. Searches the scroll container (not the whole
// document, to keep this cheap enough to run on every scroll tick on a
// real phone) for any element whose rect falls near the recurring
// "303-359px tall, top 383-439px" pattern reported from real-device
// testing, with a generous +/-30px tolerance since exact pixels vary by
// device/zoom/address-bar state. Returns full descriptors, capped to 5
// matches so the log stays readable.
const GEOMETRY_WATCH = { heightMin: 273, heightMax: 389, topMin: 353, topMax: 469 };

function findGeometryMatches(scrollEl) {
  const root = scrollEl || document;
  const all = root.querySelectorAll("div, section");
  const matches = [];
  for (const el of all) {
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

function snapshot(scrollEl, reason) {
  const t = findTargets();
  return {
    t: Math.round(performance.now()),
    reason,
    innerHeight: window.innerHeight,
    docClientHeight: document.documentElement.clientHeight,
    visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
    scrollTop: scrollEl ? Math.round(scrollEl.scrollTop) : null,
    scrollHeight: scrollEl ? scrollEl.scrollHeight : null,
    clientHeight: scrollEl ? scrollEl.clientHeight : null,
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

export default function ScrollDiagnostics({ dataReady, preload, onTogglePreload }) {
  const [log, setLog] = useState([]);
  const [variants, setVariants] = useState({});
  const [minimized, setMinimized] = useState(false);
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

  // Real Cumulative-Layout-Shift observer — the actual browser signal for
  // "did layout genuinely move", not an inference from a screen recording.
  // Item 1/2/7: every source now carries a full describeNode() (not just
  // className/tagName), sub-pixel-precision prev/cur rects (rounding was
  // masking real sub-pixel-only deltas — see the docstring), an explicit
  // `changed` flag so a "reported shift, unchanged rect" entry is visible
  // rather than silently confusing, and a dedup guard against the same
  // (startTime,value) pair ever being logged twice.
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return undefined;
    let po;
    try {
      po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const sig = `${entry.startTime}:${entry.value}`;
          if (seenShiftsRef.current.has(sig)) continue;
          seenShiftsRef.current.add(sig);
          push({
            kind: "layout-shift",
            t: Math.round(entry.startTime),
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            sources: (entry.sources || []).slice(0, 8).map((s) => {
              const prev = s.previousRect && { top: s.previousRect.top, height: s.previousRect.height };
              const cur = s.currentRect && { top: s.currentRect.top, height: s.currentRect.height };
              const changed = !!(prev && cur && (Math.abs(prev.top - cur.top) > 0.5 || Math.abs(prev.height - cur.height) > 0.5));
              return {
                node: s.node ? describeNode(s.node) : { nodeAvailable: false, note: "node no longer attached at attribution time" },
                prev, cur, changed,
              };
            }),
          });
        }
      });
      po.observe({ type: "layout-shift", buffered: true });
    } catch {
      // layout-shift not supported on this browser - not fatal, other signals still work
    }
    return () => po && po.disconnect();
  }, []);

  // rAF jank detector: flags any frame-to-frame gap over 50ms (roughly 3
  // dropped frames at 60fps) as a rough main-thread-stall proxy. Also
  // drives the throttled geometry scanner (item 3) so matches are found
  // continuously during scroll, not just on scroll events themselves.
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

  // Scroll-driven geometry snapshots (throttled) + one on mount.
  useEffect(() => {
    const scrollEl = scrollElement();
    push(snapshot(scrollEl, "mount"));
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
    return () => scrollEl?.removeEventListener("scroll", onScroll);
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

  // Item 8/9: MARK BLANK START / MARK BLANK END. Forces an immediate,
  // untruttled capture — the full snapshot() fields, an unthrottled
  // geometry-match scan (item 3, no waiting for the next 400ms tick), and
  // the last few seconds of layout-shift/jank history already in the log
  // — so the exact moment the user sees (or stops seeing) the blank area
  // can be lined up against the geometry data, instead of only ever
  // having scroll-event-driven snapshots that may land slightly before or
  // after the visual episode.
  function markBlank(edge) {
    const scrollEl = scrollElement();
    const base = snapshot(scrollEl, `blank-${edge}`);
    const recentWindow = 3000;
    push({
      kind: `blank-${edge}`,
      ...base,
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
  const shiftCount = log.filter((e) => e.kind === "layout-shift").length;
  const jankCount = log.filter((e) => e.kind === "jank").length;
  const geomMatchCount = log.filter((e) => e.kind === "geometry-scan").length;

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 999999,
        maxHeight: minimized ? "auto" : "45vh", overflowY: "auto",
        background: "rgba(10,14,20,0.94)", color: "#d6ffb3", fontFamily: "monospace",
        fontSize: 11, padding: 8, borderTop: "2px solid #4ade80",
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
            data ready: {String(dataReady)} · layout-shift events: {shiftCount} · jank frames(&gt;50ms): {jankCount} · geometry-scan hits: {geomMatchCount}
            {lastSnapshot && (
              <> · scrollTop={lastSnapshot.scrollTop} scrollHeight={lastSnapshot.scrollHeight}</>
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
                  ? `[${e.t}ms] SHIFT value=${e.value.toFixed(4)} hadRecentInput=${e.hadRecentInput} sources=${JSON.stringify(e.sources)}`
                  : e.kind === "jank"
                    ? `[${e.t}ms] JANK gap=${e.gapMs}ms`
                    : e.kind === "geometry-scan"
                      ? `[${e.t}ms] GEOM-MATCH ${e.matches.length} candidate(s)=${JSON.stringify(e.matches)}`
                      : e.kind === "blank-start" || e.kind === "blank-end"
                        ? `[${e.t}ms] ${e.kind.toUpperCase()} scrollTop=${e.scrollTop} geomMatches=${JSON.stringify(e.geometryMatches)} recentShifts=${e.recentShifts.length} recentJank=${e.recentJank.length}`
                        : `[${e.t}ms] ${e.reason} scrollTop=${e.scrollTop} rects=${JSON.stringify(e.rects)}`}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
