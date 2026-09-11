/**
 * Third-stage QBank mobile scroll fix regression guard.
 *
 * Root cause (confirmed by frame-by-frame analysis of a real-device
 * screen recording, not just theory): ProgressSummary, NextPracticeCard,
 * and RecommendedForYou each fetch their own data independently and swap
 * from a short/empty loading state to much taller real content whenever
 * their request resolves. When that height change lands while the user
 * is actively mid-scroll — these cards sit well below the fold — the
 * browser can commit the new, taller layout before it has painted the
 * newly-added region, which is exactly what the recording showed:
 * ProgressSummary's title rendered while its body (the accuracy ring and
 * stats, added only once `stats` arrives) was a large blank gap, until a
 * later repaint (e.g. reversing scroll direction) caught up.
 *
 * This is unrelated to, and does not revert, the two earlier fixes
 * (h-dvh -> h-svh, and Header moved outside AppShell's scroll region) —
 * both stay in place; this fixes a third, independent contributor.
 *
 * No DOM/rendering test infra in this repo (see mcqSemantics.test.mjs) —
 * these are source assertions confirming each skeleton's structure now
 * mirrors its loaded content's shape/height, not rendered-pixel
 * measurements.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");

const progressSummary = read("ProgressSummary.js");
const nextPracticeCard = read("NextPracticeCard.js");
const recommendedForYou = read("RecommendedForYou.js");

test("ProgressSummary's skeleton reserves the loaded content's height", async (t) => {
  await t.test("skeleton includes a ring placeholder sized to match AccuracyRing's default 112px (h-28/w-28)", () => {
    assert.match(progressSummary, /h-28 w-28 flex-none rounded-full/);
  });

  await t.test("skeleton includes 4 stat-row placeholders at the same gap-1.5 as the real rows", () => {
    const skeletonBlock = progressSummary.slice(0, progressSummary.indexOf("const rows ="));
    assert.match(skeletonBlock, /flex flex-1 flex-col gap-1\.5/);
    const rowPlaceholders = skeletonBlock.match(/h-5 rounded bg-\[var\(--color-surface-muted\)\]/g) || [];
    assert.equal(rowPlaceholders.length, 4, "must reserve space for all 4 stat rows, not fewer");
  });

  await t.test("skeleton still gates on loading OR missing stats (behavior unchanged, only sizing changed)", () => {
    assert.match(progressSummary, /if \(loading \|\| !stats\)/);
  });
});

test("NextPracticeCard's skeleton reserves space for the tallest common loaded shape", async (t) => {
  await t.test("reserves a ring placeholder (mobile stacks the AccuracyRing below the text, flex-col)", () => {
    assert.match(nextPracticeCard, /h-28 w-28 flex-none rounded-full/);
  });

  await t.test("reserves a button-sized placeholder matching the real Start Practice link's height", () => {
    assert.match(nextPracticeCard, /h-10 w-40 rounded-xl/);
  });

  await t.test("loading gate is unchanged (only the skeleton markup grew)", () => {
    assert.match(nextPracticeCard, /if \(loading\) \{/);
  });
});

test("RecommendedForYou now reserves space while loading instead of rendering nothing", async (t) => {
  await t.test("tracks an explicit loading state distinct from a genuinely-empty result", () => {
    assert.match(recommendedForYou, /const \[loading, setLoading\] = useState\(true\)/);
    assert.match(recommendedForYou, /\.finally\(\(\) => setLoading\(false\)\)/);
  });

  await t.test("renders a 3-row skeleton while loading, not null", () => {
    const loadingBranch = recommendedForYou.slice(
      recommendedForYou.indexOf("if (loading) {"),
      recommendedForYou.indexOf("if (!data ||")
    );
    assert.doesNotMatch(loadingBranch, /return null/);
    const rowPlaceholders = loadingBranch.match(/h-11 rounded-xl bg-\[var\(--color-surface-muted\)\]/g) || [];
    assert.equal(rowPlaceholders.length, 3, "must reserve space for up to 3 suggestion rows (topSuggestions.slice(0,3))");
  });

  await t.test("a genuinely-empty result (no suggestions) still collapses to nothing — that check runs AFTER the loading check", () => {
    const loadingCheckIndex = recommendedForYou.indexOf("if (loading) {");
    const emptyCheckIndex = recommendedForYou.indexOf("if (!data || data.suggestions?.length === 0) return null;");
    assert.ok(loadingCheckIndex !== -1 && emptyCheckIndex !== -1);
    assert.ok(loadingCheckIndex < emptyCheckIndex, "loading must be checked before the empty-result short-circuit");
  });
});

test("Neither earlier mobile-scroll fix was touched or reverted", async (t) => {
  await t.test("these three files have nothing to do with AppShell/h-svh/Header placement", () => {
    for (const src of [progressSummary, nextPracticeCard, recommendedForYou]) {
      assert.doesNotMatch(src, /h-svh|h-dvh|overflow-y-auto|position:\s*sticky/);
    }
  });
});
