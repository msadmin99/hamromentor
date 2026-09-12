import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "UpcomingTestRow.js"), "utf8");

test("UpcomingTestRow never renders a Start/Play/Attempt action", async (t) => {
  await t.test("no <Link>, no onClick handler, no button of any kind", () => {
    assert.doesNotMatch(src, /<Link/);
    assert.doesNotMatch(src, /onClick/);
    assert.doesNotMatch(src, /<button/i);
  });

  await t.test("shows the scheduled date and opening time only", () => {
    assert.match(src, /formatDay\(test\.scheduled_start\)/);
    assert.match(src, /Opens \{formatTime\(test\.scheduled_start\)\}/);
  });

  await t.test("shows title and question count/duration, matching PastTestRow's list treatment", () => {
    assert.match(src, /\{test\.title\}/);
    assert.match(src, /\{test\.question_count\} Questions · \{test\.duration_minutes\} Minutes/);
  });
});
