/**
 * QBank 2.0 Phase 3N/3O — QBank Home / Quick Practice integration with the
 * new Revision Center + Mistake Bank 2.0. Confirms real Phase 1 tiles now
 * route to the richer destinations, and that Quick Practice's existing
 * intelligent-mix behavior (Phase 1 §12) is untouched.
 *
 * No DOM/rendering test infra in this repo — see mcqSemantics.test.mjs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");

const smartPracticeGrid = read("SmartPracticeGrid.js");
const quickPractice = read("QuickPractice.js");

test("QBank Home tiles route to the Revision Center / Mistake Bank, not a redesign", async (t) => {
  await t.test("Due for Review routes to the Revision Center", () => {
    assert.match(smartPracticeGrid, /t\.key === "need_revision"\s*\n\s*\? "\/qbank\/revision"/);
  });

  await t.test("Master Mistakes routes to the Mistake Bank", () => {
    assert.match(smartPracticeGrid, /: t\.key === "incorrect"\s*\n\s*\? "\/qbank\/mistakes"/);
  });

  await t.test("every other tile's destination (hrefFor) is unchanged", () => {
    assert.match(smartPracticeGrid, /: hrefFor\(t\.status\);/);
  });

  await t.test("the TILES data (real counts, groups, colors) from Phase 1 is untouched", () => {
    assert.match(smartPracticeGrid, /const TILES = \[/);
    assert.match(smartPracticeGrid, /group: "recommended"/);
  });
});

test("Quick Practice keeps its Phase 1 intelligent-mix behavior and adds Quick Revision", async (t) => {
  await t.test("the existing intelligent-mix status combination is untouched", () => {
    assert.match(quickPractice, /status=weak,incorrect,need_revision,new&auto=1/);
  });

  await t.test("Quick Revision reuses the same practice-session flow with a due+mistakes-only mix", () => {
    assert.match(quickPractice, /\/qbank\/practice\?time=5&count=5&status=need_revision,incorrect&auto=1/);
  });

  await t.test("Quick Revision is a real navigation link, not a second question-serving system", () => {
    assert.match(
      quickPractice,
      /<Link\s+href="\/qbank\/practice\?time=5&count=5&status=need_revision,incorrect&auto=1"/,
    );
  });
});
