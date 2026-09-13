/**
 * QBank 2.0 Phase 4 — Progress & Learning Intelligence source assertions.
 *
 * No DOM/rendering test infra in this repo — see mcqSemantics.test.mjs
 * for the full rationale. These confirm real-data reuse, course-scoping,
 * loading/error/empty states, and that nothing here duplicates the
 * combined Test+QBank /performance page.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "page.js"), "utf8");

test("Progress reuses existing endpoints, never fabricates data", async (t) => {
  await t.test("Overall Performance reuses the existing /questions/dashboard/ endpoint", () => {
    assert.match(src, /\/questions\/dashboard\/\?\$\{params\.toString\(\)\}/);
  });

  await t.test("subject/topic/trend/mastery data comes from the new /questions/progress/ endpoint", () => {
    assert.match(src, /\/questions\/progress\/\?\$\{params\.toString\(\)\}/);
  });

  await t.test("Recommended Focus practice link reuses the existing Practice Session Builder", () => {
    assert.match(src, /\/qbank\/practice\?topic=\$\{weakestTopics\[0\]\.topic_id\}&auto=1/);
  });

  await t.test("Recommended Focus states its basis (attempts + accuracy), not an unexplained suggestion", () => {
    assert.match(src, /Based on \{weakestTopics\[0\]\.attempted\} recent attempts with \{weakestTopics\[0\]\.accuracy\}% accuracy\./);
  });
});

test("Progress is course-scoped", async (t) => {
  await t.test("useCourse() is used", () => {
    assert.match(src, /import \{ useCourse \} from "@\/lib\/course-context"/);
    assert.match(src, /const \{ activeCourse \} = useCourse\(\)/);
  });

  await t.test("both requests forward the active course", () => {
    assert.match(src, /if \(activeCourse\?\.id\) params\.set\("course", activeCourse\.id\)/);
  });

  await t.test("data reloads when the active course changes", () => {
    assert.match(src, /useEffect\(load, \[activeCourse\?\.id\]\)/);
  });
});

test("Progress does not duplicate the combined Test+QBank /performance page", async (t) => {
  await t.test("links to /performance instead of re-implementing its analytics", () => {
    assert.match(src, /href="\/performance"/);
    assert.match(src, /View combined Test \+ QBank analytics/);
  });

  await t.test("no subject-rank or mock-test analytics logic is present here", () => {
    assert.doesNotMatch(src, /mock_test|subject_rank|negative_marking/);
  });
});

test("Progress distinguishes loading / error / empty states", async (t) => {
  await t.test("a genuine fetch failure (both requests) shows a distinct error state with Retry", () => {
    assert.match(src, /Unable to load your progress\./);
    assert.match(src, /onClick=\{load\}/);
  });

  await t.test("the empty state only renders when nothing actually failed", () => {
    assert.match(src, /!loading && !progressError && !dashboardError && bySubject\.length === 0 && trend\.length === 0/);
  });

  await t.test("the empty state offers a real next action, not a dead end", () => {
    const emptyBlockStart = src.indexOf("Not enough data yet");
    const emptyBlock = src.slice(emptyBlockStart, emptyBlockStart + 500);
    assert.match(emptyBlock, /Start Practicing/);
  });

  await t.test("loading state renders a skeleton, not a blank page", () => {
    assert.match(src, /OverviewSkeleton/);
  });
});

test("Mastery distribution and subject cards use only real QuestionAttempt-backed fields", async (t) => {
  await t.test("mastery distribution reads the four real bucket keys, no fifth invented bucket", () => {
    for (const key of ["mastered", "learning", "need_practice", "weak"]) {
      assert.match(src, new RegExp(`key: "${key}"`));
    }
  });

  await t.test("subject cards use themeForKey for stable, cross-page subject color identity", () => {
    assert.match(src, /import \{ themeForKey \} from "@\/lib\/theme"/);
    assert.match(src, /themeForKey\(row\.subject_slug \|\| row\.subject_name\)/);
  });

  await t.test("accuracy trend only renders with more than one data point (a single point is not a trend)", () => {
    assert.match(src, /trend\.length > 1/);
  });
});

test("Progress page requires authentication like every other QBank page", async (t) => {
  await t.test("wrapped in RequireAuth", () => {
    assert.match(src, /import RequireAuth from "@\/components\/RequireAuth"/);
    assert.match(src, /<RequireAuth>/);
  });
});
