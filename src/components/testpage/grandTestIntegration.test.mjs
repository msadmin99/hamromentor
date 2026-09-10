/**
 * Grand Test 3.0 — Release Candidate frontend integration guards.
 *
 * This repository has no DOM/rendering test infrastructure, so — matching
 * the established pattern in singleTestSection.test.mjs and
 * mcqSemantics.test.mjs — these are source assertions on the new
 * components/pages. They pin the two rules the RC audit cares about most:
 *
 *   1. The frontend never computes Grand Test state from the browser
 *      clock — it renders the backend's own derived status.
 *   2. The Missed Exam Review never shows (or asks for) a score, rank,
 *      percentile, or the student's own answer.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

const statusPanel = read("GrandTestStatusPanel.js");
const resultExtras = read("GrandTestResultExtras.js");
const missedReview = read("../../app/tests/[id]/missed-review/page.js");
const seriesPage = read("../../app/grand-test/series/page.js");

test("GrandTestStatusPanel renders backend state, not a browser-clock computation", async (t) => {
  await t.test("reads test.grand_test_status", () => {
    assert.match(statusPanel, /grand_test_status/);
  });
  await t.test("never compares against Date.now()/new Date() to decide the state", () => {
    // Formatting a server timestamp for display is fine; deciding
    // upcoming/live/missed from the local clock is not.
    assert.doesNotMatch(statusPanel, /Date\.now\(\)/);
    assert.doesNotMatch(statusPanel, /new Date\(\)\s*[<>]/);
  });
  await t.test("has an explicit branch for every backend status value", () => {
    for (const s of ["upcoming", "live", "in_progress", "completed", "missed"]) {
      assert.match(statusPanel, new RegExp(`"${s}"`), `missing branch for ${s}`);
    }
  });
  await t.test("missed branch states no score/rank/percentile is awarded", () => {
    assert.match(statusPanel, /No score, rank or percentile/i);
  });
  await t.test("missed branch links to the dedicated missed-review route", () => {
    assert.match(statusPanel, /missed-review/);
  });
  await t.test("returns null for a non-grand test", () => {
    assert.match(statusPanel, /exam_type !== "grand"/);
  });
});

test("GrandTestResultExtras reuses the existing Smart Practice route", async (t) => {
  await t.test("Practice Now posts to the grand-test session endpoint, not a new engine", () => {
    assert.match(resultExtras, /\/student\/smart-practice\/grand-test-sessions\//);
    assert.match(resultExtras, /smart-practice\/session\//);
  });
  await t.test("renders what/why/how/future_benefit from the backend payload", () => {
    for (const f of ["rec.what", "rec.why", "rec.how", "rec.future_benefit"]) {
      assert.match(resultExtras, new RegExp(f.replace(".", "\\.")), `missing ${f}`);
    }
  });
  await t.test("handles all three review_status values", () => {
    for (const s of ["locked", "expired", "available"]) {
      assert.match(resultExtras, new RegExp(`"${s}"`));
    }
  });
  await t.test("does not fabricate a recommendation when the backend sends none", () => {
    assert.match(resultExtras, /grand_test_recommendations \|\| \[\]/);
  });
});

test("Missed Exam Review never exposes attempt-result data", async (t) => {
  await t.test("calls the dedicated missed-review endpoint", () => {
    assert.match(missedReview, /\/tests\/\$\{id\}\/missed-review\//);
  });
  await t.test("never reads an attempt-result value from the response payload", () => {
    // Reassuring copy ("there is no score, rank or percentile for a
    // missed exam") is expected and desirable — what must never happen
    // is rendering such a value FROM the data. The missed-review
    // serializer has no such field, and this page must not invent a
    // read for one.
    assert.doesNotMatch(missedReview, /data\.score|data\.rank|data\.percentile|data\.accuracy/);
    assert.doesNotMatch(missedReview, /q\.selected_option|selected_option_id|is_correct.*your/i);
    assert.doesNotMatch(missedReview, /\(your answer\)/i);
    assert.doesNotMatch(missedReview, /CORRECT<\/span>|WRONG<\/span>/);
  });
  await t.test("labels itself educational review, not a result", () => {
    assert.match(missedReview, /not an exam result|not a result|educational review/i);
  });
  await t.test("handles the expired review_status", () => {
    assert.match(missedReview, /review_status === "expired"|expired/);
  });
});

test("Series page trusts the backend's aggregates", async (t) => {
  await t.test("reads the grand-series endpoint", () => {
    assert.match(seriesPage, /\/tests\/grand-series\//);
  });
  await t.test("never recomputes an average or trend client-side", () => {
    assert.doesNotMatch(seriesPage, /reduce\(/);
    assert.match(seriesPage, /average_score_percentage/);
    assert.match(seriesPage, /data\.trend/);
  });
  await t.test("states that missed tests are not counted as zero", () => {
    assert.match(seriesPage, /never counted as a zero|not counted as a zero/i);
  });
});
