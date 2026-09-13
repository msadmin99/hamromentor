/**
 * QBank 2.0 Phase 3A/3B — Revision Center source assertions.
 *
 * No DOM/rendering test infra in this repo (see mcqSemantics.test.mjs for
 * the full rationale) — these confirm the real-data/course-scoping/empty-
 * state/error-state wiring exists in source, not rendered pixels.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "page.js"), "utf8");

test("Revision Center reuses existing endpoints, never fabricates data", async (t) => {
  await t.test("summary numbers come from the existing /questions/dashboard/ endpoint", () => {
    assert.match(src, /\/questions\/dashboard\/\?\$\{params\.toString\(\)\}/);
  });

  await t.test("category lists come from the existing paginated /questions/browse/ endpoint", () => {
    assert.match(src, /\/questions\/browse\/\?\$\{params\.toString\(\)\}/);
  });

  await t.test("Start Smart Revision reuses the existing Practice Session Builder page, not a new session runner", () => {
    assert.match(src, /\/qbank\/practice\?smart_revision=1&time=\$\{m\}&count=\$\{m\}&auto=1/);
  });

  await t.test("no hardcoded/fabricated count literals for the summary stats", () => {
    assert.doesNotMatch(src, /due_today.*:\s*24/);
    assert.doesNotMatch(src, /overdue.*:\s*7/);
  });
});

test("Revision Center is course-scoped", async (t) => {
  await t.test("useCourse() is used", () => {
    assert.match(src, /import \{ useCourse \} from "@\/lib\/course-context"/);
    assert.match(src, /const \{ activeCourse \} = useCourse\(\)/);
  });

  await t.test("stats request forwards the active course", () => {
    assert.match(src, /if \(activeCourse\?\.id\) params\.set\("course", activeCourse\.id\)/);
  });

  await t.test("stats reload when the active course changes", () => {
    assert.match(src, /useEffect\(loadStats, \[activeCourse\?\.id\]\)/);
  });

  await t.test("category list reload depends on the active course too", () => {
    const loadCategoryFn = src.slice(src.indexOf("function loadCategory"), src.indexOf("function selectCategory"));
    assert.match(loadCategoryFn, /activeCourse\.id/);
  });
});

test("Revision Center distinguishes loading / error / empty / real states", async (t) => {
  await t.test("a genuine fetch failure shows a distinct error state with Retry, not an empty list", () => {
    assert.match(src, /Unable to load your revisions\./);
    assert.match(src, /onClick=\{loadStats\}/);
  });

  await t.test("fully caught up (zero due) shows a meaningful empty state, not a generic message", () => {
    assert.match(src, /Nothing due today/);
    assert.match(src, /You are completely caught up\./);
    assert.doesNotMatch(src, /No data found/);
  });

  await t.test("the empty state offers a real next action (Practice Weak Areas), not a dead end", () => {
    const emptyBlock = src.slice(src.indexOf("allCaughtUp && ("), src.indexOf("!statsLoading && !statsError && !allCaughtUp"));
    assert.match(emptyBlock, /Practice Weak Areas/);
    assert.match(emptyBlock, /status=weak&auto=1/);
  });

  await t.test("loading state renders skeletons, not a blank page", () => {
    assert.match(src, /SummarySkeleton/);
  });
});

test("Revision categories only render when the backing count is real and positive", async (t) => {
  await t.test("category list is filtered to categories with a positive count", () => {
    assert.match(src, /CATEGORIES\.filter\(\(c\) => \(stats\?\.\[c\.statKey\] \?\? 0\) > 0\)/);
  });

  await t.test("no High Yield or fabricated category is present", () => {
    assert.doesNotMatch(src, /High Yield/);
  });
});

test("Revision Summary cards read the five real dashboard fields", async (t) => {
  for (const field of ["due_today", "overdue", "weak", "recent_mistakes", "revision_accuracy", "daily_activity"]) {
    await t.test(`reads stats.${field}`, () => {
      assert.match(src, new RegExp(`stats(\\?)?\\.${field}`));
    });
  }
});

test("Revision Center session sizing offers the required presets", async (t) => {
  await t.test("5/10/20/30 minute presets plus custom", () => {
    assert.match(src, /const TIME_OPTIONS = \[5, 10, 20, 30\]/);
    assert.match(src, /placeholder="Custom"/);
  });
});
