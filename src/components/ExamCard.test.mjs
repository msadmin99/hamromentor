/**
 * Grand Test card visual update — adds the exam's scheduled date/time
 * (ISO date + full weekday + 12h time) above the Questions/Minutes stats
 * row, matching the target design. Reuses `test.scheduled_start`, already
 * serialized by TestListSerializer (tests_app/serializers.py) — no
 * backend change involved. Extended to Daily Test cards with the exact
 * same implementation (same field, same formatting, same placement) —
 * Daily Test listing already sorts by scheduled_start, so it's the
 * correct source there too, not a new concept borrowed from Grand Test.
 *
 * No DOM/rendering test infra in this repo (see other *.test.mjs files
 * for the same convention) — these are source assertions confirming the
 * gating logic and formatting approach, not rendered-pixel measurements.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "ExamCard.js"), "utf8");

test("the scheduled date/time row is added only for Grand Test and Daily Test cards", async (t) => {
  await t.test("gated on exam_type being 'grand' or 'daily', not shown for other exam types", () => {
    assert.match(src, /const schedule = \["grand", "daily"\]\.includes\(test\.exam_type\) \? formatScheduleParts\(test\.scheduled_start\) : null;/);
  });

  await t.test("mock/pyq/qbank exam types are excluded (the allowlist is exactly grand+daily, not everything but those)", () => {
    assert.doesNotMatch(src, /"mock", "grand", "daily"|"grand", "daily", "mock"|"pyq".*schedule/);
  });

  await t.test("renders nothing when there is no scheduled_start (formatScheduleParts returns null)", () => {
    assert.match(src, /function formatScheduleParts\(value\) \{\s*if \(!value\) return null;/);
    assert.match(src, /\{schedule && \(/);
  });

  await t.test("an invalid date value is handled without throwing (NaN guard)", () => {
    assert.match(src, /if \(Number\.isNaN\(d\.getTime\(\)\)\) return null;/);
  });
});

test("the schedule row shows ISO date + full weekday + 12h time, matching the target design", async (t) => {
  await t.test("date formatted as YYYY-MM-DD (en-CA locale trick)", () => {
    assert.match(src, /isoDate: d\.toLocaleDateString\("en-CA"\)/);
  });

  await t.test("weekday spelled out in full, not abbreviated", () => {
    assert.match(src, /weekday: d\.toLocaleDateString\("en-US", \{ weekday: "long" \}\)/);
  });

  await t.test("time in 12h format with AM/PM", () => {
    assert.match(src, /time: d\.toLocaleTimeString\("en-US", \{ hour: "numeric", minute: "2-digit" \}\)/);
  });

  await t.test("all three pieces render with the calendar icon, in order", () => {
    const block = src.slice(src.indexOf("{schedule && ("), src.indexOf("{schedule && (") + 400);
    assert.match(block, /📅/);
    assert.match(block, /\{schedule\.isoDate\}[\s\S]*\{schedule\.weekday\}[\s\S]*\{schedule\.time\}/);
  });
});

test("the schedule row sits between the description and the Questions/Minutes stats row", async (t) => {
  await t.test("source order: description paragraph, then schedule row, then StatBlock row", () => {
    const descIndex = src.indexOf('{test.description || meta.tagline}');
    const scheduleIndex = src.indexOf("{schedule && (");
    const statsIndex = src.indexOf('<StatBlock icon="❓"');
    assert.ok(descIndex !== -1 && scheduleIndex !== -1 && statsIndex !== -1);
    assert.ok(descIndex < scheduleIndex && scheduleIndex < statsIndex);
  });
});

test("Regression safety: existing card behavior is untouched", async (t) => {
  await t.test("StatBlock (Questions/Minutes) is unchanged", () => {
    assert.match(src, /<StatBlock icon="❓" value=\{test\.question_count\} label="Questions" \/>/);
    assert.match(src, /<StatBlock icon="⏱️" value=\{test\.duration_minutes\} label="Minutes" \/>/);
  });

  await t.test("PRO/difficulty badges, attempts-left text, and Details link are unchanged", () => {
    assert.match(src, /👑 PRO/);
    assert.match(src, /attempt\$\{attemptsLeft === 1 \? "" : "s"\} left/);
    assert.match(src, /Details →/);
  });

  await t.test("the disabled/CTA button logic (Not open yet / Exam window closed / real CTA) is unchanged", () => {
    assert.match(src, /presentation\.disabled \? \(/);
    assert.match(src, /aria-disabled="true"/);
  });

  await t.test("PYQ's own academic_year badge (separate from this change) is unchanged", () => {
    assert.match(src, /test\.exam_type === "pyq" && test\.academic_year/);
  });
});
