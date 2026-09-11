/**
 * Phase 6 diagnostics-only upgrade regression guard, extended in Phase 7
 * for the self-contamination fix (no production behavior touched — this
 * file only asserts against ScrollDiagnostics.js itself, which only ever
 * mounts behind ?debug=1, see qbank/page.js).
 *
 * Phase 7 background: a real-device JSON export showed the recurring
 * 303px<->359px / top 383px<->439px pattern was the diagnostic panel
 * itself (its own text "QBank Scroll Diagnostics (?debug=1) ... MARK
 * BLANK START ..." turned up as a geometry-scan "source"), because the
 * geometry scanner swept the scroll container's descendants and the
 * panel — despite being `position: fixed` — is rendered as a DOM child
 * of that same container. These tests confirm the three independent
 * fixes: (1) an explicit `data-qbank-debug-overlay` exclusion applied to
 * every scanner, (2) the panel is portaled onto document.body so it is
 * structurally no longer a descendant of QBank at all, and (3) the
 * panel's own on-screen height is fixed, not content-driven, so it can't
 * generate a genuine self-inflicted shift either.
 *
 * Source assertions only (no DOM/rendering infra in this repo — see
 * mcqSemantics.test.mjs).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "ScrollDiagnostics.js"), "utf8");

test("layout-shift sources now carry a full node descriptor, not just className/tagName", async (t) => {
  await t.test("describeNode captures tag/id/class/testid/aria-label/role/text/parent/grandparent/section/rect/style", () => {
    for (const field of [
      "tag: el.tagName",
      "id: el.id",
      'testId: el.getAttribute?.("data-testid")',
      'ariaLabel: el.getAttribute?.("aria-label")',
      "role: el.getAttribute?.(\"role\")",
      "text: shortText(el)",
      "parent: tagClass(el.parentElement)",
      "grandparent: tagClass(el.parentElement?.parentElement)",
      "nearestSection:",
      "rect: { top: r.top, left: r.left, width: r.width, height: r.height }",
      "transform: cs.transform, filter: cs.filter, willChange: cs.willChange",
    ]) {
      assert.ok(src.includes(field), `missing descriptor field: ${field}`);
    }
  });

  await t.test("prev/cur rects are not rounded (sub-pixel deltas were being masked)", () => {
    assert.match(src, /prev = s\.previousRect && \{ top: s\.previousRect\.top, height: s\.previousRect\.height \}/);
    assert.doesNotMatch(src, /prev: s\.previousRect && \{ top: Math\.round/);
  });

  await t.test("duplicate (startTime,value) layout-shift entries are deduplicated", () => {
    assert.match(src, /seenShiftsRef\.current\.has\(sig\)/);
  });
});

test("Phase 7: the debug overlay is excluded from every scanner via a structural marker, not text matching", async (t) => {
  await t.test("the panel root carries a dedicated, reliable marker attribute", () => {
    assert.match(src, /data-qbank-debug-overlay="true"/);
    assert.match(src, /const DEBUG_OVERLAY_SELECTOR = "\[data-qbank-debug-overlay\]";/);
  });

  await t.test("exclusion is structural (closest/attribute), never a text-content check like 'QBank Scroll Diagnostics'", () => {
    assert.match(src, /function isDebugOverlayNode\(el\) \{/);
    assert.match(src, /el\.closest\(DEBUG_OVERLAY_SELECTOR\)/);
    assert.doesNotMatch(src, /textContent.*QBank Scroll Diagnostics/);
  });

  await t.test("findTargets() skips debug-overlay nodes", () => {
    const fn = src.slice(src.indexOf("function findTargets"), src.indexOf("function rect("));
    assert.match(fn, /if \(isDebugOverlayNode\(el\)\) continue;/);
  });

  await t.test("findGeometryMatches() skips debug-overlay nodes", () => {
    const fn = src.slice(src.indexOf("function findGeometryMatches"), src.indexOf("// Phase 7, item 6"));
    assert.match(fn, /if \(isDebugOverlayNode\(el\)\) continue;/);
  });

  await t.test("layout-shift sources filter out debug-overlay nodes before logging, not merely tag them", () => {
    assert.match(src, /\.filter\(\(s\) => !s\.node \|\| !isDebugOverlayNode\(s\.node\)\)/);
  });

  await t.test("an entry whose every source was the overlay is flagged debugOverlayOnly and excluded from the QBank shift count", () => {
    assert.match(src, /debugOverlayOnly: rawSources\.length > 0 && sources\.length === 0/);
    assert.match(src, /const qbankShiftEvents = log\.filter\(\(e\) => e\.kind === "layout-shift" && !e\.debugOverlayOnly\)/);
  });
});

test("Phase 7: the panel is portaled onto document.body, not rendered inside the QBank scroll container", async (t) => {
  await t.test("createPortal is imported from react-dom and targets document.body", () => {
    assert.match(src, /import \{ createPortal \} from "react-dom";/);
    assert.match(src, /createPortal\(\s*<div/);
    assert.match(src, /document\.body\s*\);/);
  });

  await t.test("a mounted gate avoids calling createPortal before document.body exists (SSR-safe), via a lazy initializer not an effect", () => {
    assert.match(src, /const \[mounted\] = useState\(\(\) => typeof document !== "undefined"\);/);
    assert.match(src, /if \(!mounted\) return null;/);
  });
});

test("Phase 7: the panel's own dimensions are fixed, not content-driven, so it cannot self-shift", async (t) => {
  await t.test("height is a fixed value per mode, not maxHeight:auto", () => {
    assert.match(src, /const PANEL_HEIGHT_EXPANDED = "45vh";/);
    assert.match(src, /const PANEL_HEIGHT_MINIMIZED = 44;/);
    assert.match(src, /height: minimized \? PANEL_HEIGHT_MINIMIZED : PANEL_HEIGHT_EXPANDED/);
    assert.doesNotMatch(src, /maxHeight: minimized \? "auto"/);
  });
});

test("Phase 7, item 6: mount snapshot waits for layout to settle and flags an unavailable measurement instead of trusting a literal 0", async (t) => {
  await t.test("mount capture is deferred by two animation frames", () => {
    const fn = src.slice(src.indexOf("// Phase 7, item 6"), src.indexOf("// Apply Phase 4 variant toggles"));
    assert.match(fn, /requestAnimationFrame\(\(\) => \{\s*raf1 = requestAnimationFrame/);
  });

  await t.test("snapshot() computes measurementUnavailable instead of treating scrollHeight:0/clientHeight:0 as valid", () => {
    assert.match(src, /const measurementUnavailable = !!scrollEl && scrollHeight === 0 && clientHeight === 0;/);
    assert.match(src, /measurementUnavailable,/);
  });
});

test("Phase 7, item 8: blank markers capture named QBank targets with full style detail, excluding the overlay", async (t) => {
  await t.test("both buttons still exist", () => {
    assert.match(src, />\s*MARK BLANK START\s*</);
    assert.match(src, />\s*MARK BLANK END\s*</);
  });

  await t.test("markBlank() builds targetDetails from findTargets() (already overlay-excluded) via describeNode()", () => {
    const fn = src.slice(src.indexOf("function markBlank"), src.indexOf("function copyLog"));
    assert.match(fn, /const targets = findTargets\(\);/);
    assert.match(fn, /Object\.fromEntries\(Object\.entries\(targets\)\.map\(\(\[k, el\]\) => \[k, describeNode\(el\)\]\)\)/);
    assert.match(fn, /geometryMatches: findGeometryMatches\(scrollEl\)/);
  });

  await t.test("TARGETS now includes the additional named QBank sections requested (pageRoot/qbankHero/nextPracticeCard/subjectGrid)", () => {
    assert.match(src, /key: "pageRoot"/);
    assert.match(src, /key: "qbankHero"/);
    assert.match(src, /key: "nextPracticeCard"/);
    assert.match(src, /key: "subjectGrid"/);
  });
});

test("this stage touched no production file — diagnostics-only, unchanged mount gate", async (t) => {
  await t.test("still only ever mounts behind ?debug=1 per its own docstring", () => {
    assert.match(src, /only mounts when\s*\* the URL has \?debug=1/);
  });

  await t.test("Phase 4/5 toggles and the existing variant CSS are untouched", () => {
    assert.match(src, /const VARIANTS = \[/);
    assert.match(src, /const VARIANT_CSS = \{/);
    assert.match(src, /onTogglePreload/);
  });

  await t.test("no scroll/resize/IntersectionObserver logic was added outside this file (still only PerformanceObserver + rAF + one scroll listener)", () => {
    const listenerCount = (src.match(/addEventListener\(/g) || []).length;
    assert.equal(listenerCount, 1, "exactly one addEventListener call (the existing scroll listener) — no new listener types added");
  });
});
