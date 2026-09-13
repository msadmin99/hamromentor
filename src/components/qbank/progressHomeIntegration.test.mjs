/**
 * QBank 2.0 Phase 4 — QBank Home's ProgressSummary now points at the new
 * QBank-specific Progress page rather than the combined /performance page.
 *
 * No DOM/rendering test infra in this repo — see mcqSemantics.test.mjs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "ProgressSummary.js"), "utf8");

test("ProgressSummary links to the new QBank Progress page", async (t) => {
  await t.test("'View detailed progress' now points at /qbank/progress", () => {
    assert.match(src, /href="\/qbank\/progress"/);
  });

  await t.test("no longer claims detailed breakdowns stay only on /performance", () => {
    assert.doesNotMatch(src, /Detailed breakdowns.*stay on\s*\* the existing \/performance page, not duplicated here\./s);
  });

  await t.test("still uses the same /questions/dashboard/ data, no new request added", () => {
    assert.match(src, /all real, QBank-scoped numbers from the same/);
    assert.match(src, /\/questions\/dashboard\/ call the page already makes \(no extra request\)/);
  });
});
