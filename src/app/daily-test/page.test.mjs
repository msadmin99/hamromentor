/**
 * Daily Test schedule audit — Today/Upcoming/Past bucketing.
 *
 * Root cause fixed: card_status === "upcoming" was previously treated as
 * "today" unconditionally (get_card_status() on the backend returns
 * 'upcoming' for ANY future scheduled_start, today or 20 days out). With
 * Admin able to schedule 20-30 days of Daily Tests at once, every
 * not-yet-open test landed in "Today's Daily Tests". This is a
 * frontend-only date check (scheduled_start is already on every test) —
 * no backend field needed.
 *
 * No DOM/rendering test infra in this repo (see other *.test.mjs files
 * for the same convention) — these are source assertions confirming the
 * bucketing logic and section wiring, not rendered-pixel measurements.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "page.js"), "utf8");

test("Today's Daily Tests only includes same-calendar-day 'upcoming' tests", async (t) => {
  await t.test("isSameCalendarDay compares year/month/date, not just a raw timestamp diff", () => {
    assert.match(
      src,
      /d\.getFullYear\(\) === reference\.getFullYear\(\) && d\.getMonth\(\) === reference\.getMonth\(\) && d\.getDate\(\) === reference\.getDate\(\)/,
    );
  });

  await t.test("a test with no scheduled_start at all is never excluded from Today (legacy safety)", () => {
    assert.match(src, /if \(!value\) return true; \/\/ no schedule info at all -> never excluded from Today/);
  });

  await t.test("the `today` bucket gates 'upcoming' rows on isSameCalendarDay, not just card_status", () => {
    assert.match(
      src,
      /const today = tests\.filter\(\s*\(t\) => t\.card_status === "available" \|\| t\.card_status === "in_progress" \|\| \(t\.card_status === "upcoming" && isSameCalendarDay\(t\.scheduled_start, now\)\),\s*\);/,
    );
  });
});

test("a new Upcoming Daily Tests bucket/section exists for non-today 'upcoming' tests", async (t) => {
  await t.test("the `upcoming` bucket excludes tests with no scheduled_start (nothing to show a date for) and same-day tests", () => {
    assert.match(
      src,
      /const upcoming = tests\s*\.filter\(\(t\) => t\.card_status === "upcoming" && t\.scheduled_start && !isSameCalendarDay\(t\.scheduled_start, now\)\)/,
    );
  });

  await t.test("upcoming tests are sorted soonest-first", () => {
    assert.match(src, /\.sort\(\(a, b\) => new Date\(a\.scheduled_start\) - new Date\(b\.scheduled_start\)\)/);
  });

  await t.test("the Upcoming section renders UpcomingTestRow, never ExamCard (no Start/Play action)", () => {
    const section = src.slice(src.indexOf('order-2 lg:order-3'), src.indexOf('order-3 lg:order-4'));
    assert.match(section, /<UpcomingTestRow key=\{t\.id\} test=\{t\} \/>/);
    assert.doesNotMatch(section, /<ExamCard/);
  });

  await t.test("Upcoming has its own View More pagination, independent of Past's", () => {
    assert.match(src, /const UPCOMING_PAGE_SIZE = 4;/);
    assert.match(src, /const \[upcomingVisible, setUpcomingVisible\] = useState\(UPCOMING_PAGE_SIZE\);/);
    assert.match(src, /View More Upcoming Tests ⌄/);
  });
});

test("Regression safety: Today and Past sections are otherwise unchanged", async (t) => {
  await t.test("Today still renders ExamCard in a grid, unchanged", () => {
    const section = src.slice(src.indexOf('order-1 lg:order-2'), src.indexOf('{!loading && !error && upcoming.length > 0'));
    assert.match(section, /<ExamCard key=\{t\.id\} test=\{t\} \/>/);
  });

  await t.test("Past's own filter/sort (completed/missed, most-recent-first) is untouched", () => {
    assert.match(
      src,
      /const past = tests\s*\.filter\(\(t\) => t\.card_status === "completed" \|\| t\.card_status === "missed"\)\s*\.sort\(\(a, b\) => new Date\(b\.scheduled_start \|\| b\.created_at\) - new Date\(a\.scheduled_start \|\| a\.created_at\)\);/,
    );
  });

  await t.test("PastTestRow is still imported and used for Past", () => {
    assert.match(src, /import PastTestRow from "@\/components\/testpage\/PastTestRow";/);
    assert.match(src, /<PastTestRow key=\{t\.id\} test=\{t\} \/>/);
  });
});
