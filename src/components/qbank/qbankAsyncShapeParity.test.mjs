/**
 * Fourth-stage QBank mobile scroll fix regression guard.
 *
 * Root cause (confirmed against real code, not assumption): after the
 * third-stage skeleton-sizing fix (qbankLoadingSkeletons.test.mjs), two
 * further loading->loaded shape mismatches were still live and firing
 * genuine layout-shift events while the user could be mid-scroll on the
 * single nested overflow-y-auto scroll container (AppShell.js):
 *
 * 1. NextPracticeCard's skeleton always reserves a 112px (h-28 w-28)
 *    AccuracyRing slot, but the loaded content only ever rendered that
 *    ring for a `revise_topic`/`improve_subject` top suggestion — never
 *    for `retry_mistakes`, `new_subject`, or `start_new` (confirmed
 *    against Backend/academics/views.py: QuestionViewSet.recommended(),
 *    only the first two suggestion types ever set an `accuracy` key).
 *    `start_new` is the suggestion every brand-new/lightly-active student
 *    gets — an everyday case, not a rare edge case — so this card shrank
 *    by ~130px on load for exactly that population.
 *
 * 2. SubjectGrid's loading skeleton rendered a hardcoded 4 placeholder
 *    cards while its loaded view shows up to INITIAL_COUNT (5) real
 *    cards — an off-by-one mismatch that fired on nearly every load,
 *    since a real course almost always has >= 5 subjects.
 *
 * (A third candidate — RecommendedForYou collapsing to `return null` on a
 * genuinely-empty /questions/recommended/ result — was investigated and
 * ruled out: Backend/academics/views.py's recommended() always appends a
 * `start_new` fallback suggestion when nothing else qualifies, so
 * `suggestions` is never actually empty and that branch is unreachable.
 * No test added for a non-bug.)
 *
 * These are source assertions (no DOM/rendering test infra in this repo,
 * see mcqSemantics.test.mjs) confirming the loaded shape now matches its
 * own skeleton in every case, not rendered-pixel measurements.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");

const nextPracticeCard = read("NextPracticeCard.js");
const subjectGrid = read("SubjectGrid.js");

test("NextPracticeCard reserves its ring slot even when no ring is shown", async (t) => {
  await t.test("the loaded content has a same-sized invisible spacer for the no-ring branch", () => {
    assert.match(
      nextPracticeCard,
      /isRealPractice && top\.accuracy_pct != null \? \(\s*<AccuracyRing[\s\S]*?\) : \(\s*[\s\S]*?<div className="h-28 w-28 flex-none" aria-hidden="true" \/>/
    );
  });

  await t.test("the spacer matches the skeleton's own ring dimensions exactly (h-28 w-28)", () => {
    const skeletonRing = nextPracticeCard.match(/h-28 w-28 flex-none rounded-full bg-\[var\(--color-surface-muted\)\]/);
    const loadedSpacer = nextPracticeCard.match(/h-28 w-28 flex-none" aria-hidden="true"/);
    assert.ok(skeletonRing, "skeleton must still reserve a 112px ring slot");
    assert.ok(loadedSpacer, "loaded content must reserve the same 112px slot when the ring is absent");
  });
});

test("SubjectGrid's loading skeleton count matches its own loaded view", async (t) => {
  await t.test("skeleton count uses INITIAL_COUNT, not a hardcoded number", () => {
    assert.match(subjectGrid, /Array\.from\(\{ length: INITIAL_COUNT \}\)/);
    assert.doesNotMatch(subjectGrid, /Array\.from\(\{ length: 4 \}\)/);
  });

  await t.test("INITIAL_COUNT still drives the loaded view's default visible slice (unchanged)", () => {
    assert.match(subjectGrid, /const INITIAL_COUNT = 5;/);
    assert.match(subjectGrid, /subjects\.slice\(0, INITIAL_COUNT\)/);
  });
});

test("Neither earlier mobile-scroll fix was touched or reverted", async (t) => {
  await t.test("these two files have nothing to do with AppShell/h-svh/Header placement", () => {
    for (const src of [nextPracticeCard, subjectGrid]) {
      assert.doesNotMatch(src, /h-svh|h-dvh|overflow-y-auto|position:\s*sticky/);
    }
  });
});
