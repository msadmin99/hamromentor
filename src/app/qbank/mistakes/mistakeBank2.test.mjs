/**
 * QBank 2.0 Phase 3D/3E — Mistake Bank 2.0 source assertions: course
 * scoping (previously entirely absent — the documented inconsistency vs.
 * Bookmarks), Weak/Confidence Trap filters, and the enriched card fields
 * (wrong count, last attempted, confidence).
 *
 * No DOM/rendering test infra in this repo — see mcqSemantics.test.mjs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "page.js"), "utf8");

test("Mistake Bank is now course-scoped, matching Bookmarks", async (t) => {
  await t.test("useCourse() is used", () => {
    assert.match(src, /import \{ useCourse \} from "@\/lib\/course-context"/);
    assert.match(src, /const \{ activeCourse \} = useCourse\(\)/);
  });

  await t.test("the mistakes request forwards the active course", () => {
    assert.match(src, /if \(activeCourse\?\.id\) params\.set\("course", activeCourse\.id\)/);
  });

  await t.test("the list reloads when the active course changes", () => {
    assert.match(src, /\}, \[scope, subject, activeCourse\?\.id\]\);/);
  });
});

test("Weak and Confidence Trap filters are backed by real fields, not fabricated", async (t) => {
  await t.test("Weak filter checks the real mastery_status field", () => {
    assert.match(src, /if \(weakOnly && q\.mastery_status !== "weak"\) return false;/);
  });

  await t.test("Confidence Trap filter checks the real confidence field", () => {
    assert.match(src, /if \(highConfidenceOnly && q\.confidence !== "confident"\) return false;/);
  });

  await t.test("both filters are client-side over already-loaded results, not a second backend query", () => {
    const filterBlock = src.slice(src.indexOf("const filteredResults"), src.indexOf("async function toggleBookmark"));
    assert.match(filterBlock, /results\.filter/);
  });
});

test("Mistake cards show wrong count, last attempted, and Confidence Trap — only when real", async (t) => {
  await t.test("wrong count reads the real incorrect_count field", () => {
    assert.match(src, /q\.incorrect_count/);
  });

  await t.test("repeated-mistake threshold is documented and matches the backend's own constant", () => {
    assert.match(src, /const REPEATED_MISTAKE_MIN_COUNT = 2; \/\/ mirrors academics\/views\.py's own documented constant/);
  });

  await t.test("last attempted is derived from the real last_attempted_at field, not invented", () => {
    assert.match(src, /function formatLastAttempted\(iso\)/);
    assert.match(src, /formatLastAttempted\(q\.last_attempted_at\)/);
  });

  await t.test("Confidence Trap badge only renders for a real confident+incorrect combination", () => {
    assert.match(src, /const isConfidenceTrap = q\.confidence === "confident";/);
    assert.match(src, /Confidence Trap/);
  });
});

test("mobile-safe: filter rows and card metadata wrap instead of overflowing", async (t) => {
  await t.test("the new filter row scrolls horizontally rather than overflowing the viewport", () => {
    const filterRowStart = src.indexOf("QBank 2.0 Phase 3D/3F: client-side filters");
    const filterRowBlock = src.slice(filterRowStart, filterRowStart + 700);
    assert.match(filterRowBlock, /hm-scrollbar-none/);
    assert.match(filterRowBlock, /overflow-x-auto/);
  });

  await t.test("the enriched metadata row wraps on narrow screens", () => {
    assert.match(src, /flex flex-wrap items-center gap-2 text-\[11px\] text-\[var\(--color-text-muted\)\]/);
  });
});
