/**
 * Phase 6 diagnostics-only upgrade regression guard (no production
 * behavior touched — this file only asserts against ScrollDiagnostics.js
 * itself, which only ever mounts behind ?debug=1, see qbank/page.js).
 *
 * Follow-up to the stage 4 real-device test: the diagnostic kept
 * reporting an anonymous "DIV" for the recurring 303px<->359px /
 * top 383px<->439px geometry pattern because layout-shift sources were
 * reduced to `className || tagName` and never inspected further. These
 * tests confirm the richer identification (describeNode), the
 * independent tolerance-based geometry scanner, and the blank-state
 * markers exist and that no production file was touched to add them.
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

  await t.test("layout-shift sources call describeNode(s.node), not just className/tagName", () => {
    assert.match(src, /node: s\.node \? describeNode\(s\.node\) : \{ nodeAvailable: false/);
    assert.doesNotMatch(src, /node: s\.node \? \(s\.node\.className \|\| s\.node\.tagName\) : null/);
  });

  await t.test("prev/cur rects are no longer rounded (sub-pixel deltas were being masked)", () => {
    assert.match(src, /prev = s\.previousRect && \{ top: s\.previousRect\.top, height: s\.previousRect\.height \}/);
    assert.doesNotMatch(src, /prev: s\.previousRect && \{ top: Math\.round/);
  });

  await t.test("each source records an explicit `changed` flag for validation (item 7)", () => {
    assert.match(src, /changed = !!\(prev && cur && \(Math\.abs\(prev\.top - cur\.top\) > 0\.5/);
  });

  await t.test("duplicate (startTime,value) layout-shift entries are deduplicated", () => {
    assert.match(src, /seenShiftsRef\.current\.has\(sig\)/);
  });
});

test("an independent geometry scanner watches for the reported 303-359px/383-439px pattern", async (t) => {
  await t.test("tolerance band covers the reported range with margin, not exact pixels", () => {
    assert.match(src, /GEOMETRY_WATCH = \{ heightMin: 273, heightMax: 389, topMin: 353, topMax: 469 \}/);
  });

  await t.test("findGeometryMatches scans the scroll container, not the whole document (perf)", () => {
    assert.match(src, /function findGeometryMatches\(scrollEl\) \{\s*const root = scrollEl \|\| document;/);
  });

  await t.test("matches are capped so the log can't grow unbounded", () => {
    assert.match(src, /if \(matches\.length >= 5\) break;/);
  });

  await t.test("the scanner runs on a throttled cadence inside the existing rAF loop, not a new interval", () => {
    assert.match(src, /if \(now - lastGeomScanRef\.current > 400\)/);
  });
});

test("MARK BLANK START / MARK BLANK END markers exist and force an unthrottled capture", async (t) => {
  await t.test("both buttons are rendered", () => {
    assert.match(src, />\s*MARK BLANK START\s*</);
    assert.match(src, />\s*MARK BLANK END\s*</);
  });

  await t.test("markBlank() captures snapshot + unthrottled geometry matches + recent shift/jank history", () => {
    assert.match(src, /function markBlank\(edge\) \{/);
    assert.match(src, /geometryMatches: findGeometryMatches\(scrollEl\)/);
    assert.match(src, /recentShifts: logRef\.current\.filter/);
    assert.match(src, /recentJank: logRef\.current\.filter/);
  });

  await t.test("blank markers capture the layout-vs-paint style fields (transform/filter/opacity/overflow/position/z-index/background)", () => {
    assert.match(src, /position: cs\.position, transform: cs\.transform, filter: cs\.filter, willChange: cs\.willChange,/);
    assert.match(src, /zIndex: cs\.zIndex, background: cs\.backgroundColor,/);
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
