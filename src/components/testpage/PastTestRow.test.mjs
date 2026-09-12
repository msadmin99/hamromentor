/**
 * Daily Test schedule audit: a missed Daily Test's "Attempt Now →" link
 * used to actually work (no backend enforcement existed for Daily
 * Test's scheduled window). Now that _start_attempt enforces it, this
 * button would just fail with a 403 — replaced with the same honest,
 * disabled-button treatment ExamCard.js already uses for a closed exam.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "PastTestRow.js"), "utf8");

test("a missed row no longer offers a live Attempt Now action", async (t) => {
  await t.test("'Attempt Now' text no longer exists anywhere in the file", () => {
    assert.doesNotMatch(src, /Attempt Now/);
  });

  await t.test("the missed branch renders a disabled, non-navigating indicator instead", () => {
    const block = src.slice(src.indexOf("{isMissed ? ("), src.indexOf(") : ("));
    assert.match(block, /aria-disabled="true"/);
    assert.doesNotMatch(block, /<Link/);
    assert.match(block, /Window Closed/);
  });
});

test("a non-missed row (completed) still links to Review Test, unchanged", async (t) => {
  await t.test("Review Test link and its href fallback logic are preserved", () => {
    const block = src.slice(src.indexOf(") : ("), src.indexOf(")}\n      </div>"));
    assert.match(block, /href=\{!test\.latest_attempt_id \? `\/tests\/\$\{test\.id\}` : `\/tests\/result\/\$\{test\.latest_attempt_id\}`\}/);
    assert.match(block, /Review Test →/);
  });
});

test("Regression safety: the day/month formatting and status meta are untouched", async (t) => {
  await t.test("formatDay and STATUS_META are unchanged", () => {
    assert.match(src, /function formatDay\(value\) \{/);
    assert.match(src, /const STATUS_META = \{/);
    assert.match(src, /completed: \{ label: "Completed", className: "text-brand-green" \}/);
    assert.match(src, /missed: \{ label: "Missed", className: "text-brand-red" \}/);
  });
});
