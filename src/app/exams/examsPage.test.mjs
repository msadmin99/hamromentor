// Mobile Exams Hub Visual Redesign — source-text tests, the same pattern
// used throughout this repo (e.g. lib/bottomNav.test.mjs): there's no
// rendering harness here (plain `node --test`, no DOM/jsdom), so these
// assert against the actual page/component source rather than a rendered
// tree. Covers Step 43 of the task spec.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(join(__dirname, "page.js"), "utf8");
const cardSource = readFileSync(join(__dirname, "..", "..", "components", "exams", "ExamCategoryCard.js"), "utf8");
const headerSource = readFileSync(join(__dirname, "..", "..", "components", "Header.js"), "utf8");
const courseSwitcherSource = readFileSync(join(__dirname, "..", "..", "components", "CourseSwitcher.js"), "utf8");
// For assertions about what the page actually *renders* (as opposed to
// what its comments discuss) — this file's own explanatory comments
// legitimately name the reference screenshot's rejected copy ("Random
// Questions", "leaderboard", "Most Popular") while explaining why it was
// replaced, same as bottomNav.test.mjs's own withoutComments precedent.
const pageCode = stripComments(pageSource);

test("hero", async (t) => {
  await t.test("Exams heading exists", () => {
    assert.match(pageSource, /Header title="Exams"/);
  });

  await t.test("a supporting subtitle exists", () => {
    assert.match(pageSource, /subtitle="Choose an exam type/);
  });

  await t.test("course selector is present and reuses the real course-switching component", () => {
    assert.match(pageSource, /<CourseSwitcher variant="solid" \/>/);
    // Not a second implementation: same component, same useCourse()/
    // switchCourse() logic every other page's CourseSwitcher already uses.
    assert.match(courseSwitcherSource, /useCourse\(\)/);
    assert.doesNotMatch(pageSource, /useCourse\(/);
  });

  await t.test("Header gained an additive children slot rather than a page-specific fork", () => {
    assert.match(headerSource, /children = null/);
    assert.match(headerSource, /\{children\}/);
  });
});

test("four exam category cards", async (t) => {
  const cards = [
    ["mock-test", "Mock Test"],
    ["daily-test", "Daily Test"],
    ["grand-test", "Grand Test"],
    ["past-year-questions", "Past Year Questions"],
  ];

  for (const [slug, title] of cards) {
    await t.test(`${title} card exists with its real, unchanged route`, () => {
      assert.match(pageSource, new RegExp(`href: "/${slug}",\\s*\\n\\s*title: "${title.replace(/ /g, "\\s")}"`));
    });
  }

  await t.test("exactly four categories are configured", () => {
    const matches = pageSource.match(/href: "\/(mock-test|daily-test|grand-test|past-year-questions)"/g) || [];
    assert.equal(matches.length, 4);
  });
});

test("card visual sections (Step 2/7/45 architecture)", async (t) => {
  await t.test("one shared card component, not four independent ones", () => {
    assert.match(pageSource, /import ExamCategoryCard from "@\/components\/exams\/ExamCategoryCard"/);
    assert.match(pageSource, /EXAM_CATEGORIES\.map/);
  });

  await t.test("cards render as a single stacked column, not a 2x2 tile grid", () => {
    // Step 13 explicitly supersedes the earlier compact 2x2 idea for this
    // page: no sm:grid-cols-2 (or similar) on the cards' container.
    assert.match(pageSource, /flex flex-col gap-4 sm:gap-5/);
    assert.doesNotMatch(pageSource, /grid-cols-2/);
  });

  await t.test("the whole card is one real link — no clickable div, no nested link-in-button", () => {
    assert.match(cardSource, /import Link from "next\/link"/);
    assert.match(cardSource, /<Link[\s\S]*href=\{href\}/);
    assert.doesNotMatch(cardSource, /onClick=\{.*router\.push/);
  });

  await t.test("left visual panel exists", () => {
    assert.match(cardSource, /<Icon className="h-7 w-7" \/>/);
    assert.match(cardSource, /panelLabel/);
  });

  await t.test("title, description, badge, feature chips, and an arrow CTA all exist", () => {
    assert.match(cardSource, /<h2[^>]*>\{title\}<\/h2>/);
    assert.match(cardSource, /\{description\}/);
    assert.match(cardSource, /\{badge\}/);
    assert.match(cardSource, /features\.map/);
    assert.match(cardSource, /ChevronRightIcon/);
  });
});

test("data truthfulness (Step 33/34) — no fabricated statistics or capabilities", async (t) => {
  await t.test("no hard-coded question-count/duration numbers from the reference screenshot", () => {
    assert.doesNotMatch(pageCode, /200\s*Questions/);
    assert.doesNotMatch(pageCode, /50\s*Questions/);
    assert.doesNotMatch(pageCode, /3\s*Hours/);
    assert.doesNotMatch(pageCode, /60\s*Minutes/);
  });

  await t.test('does not claim "Random Questions" — Mock Test\'s question set is fixed, only order is shuffled', () => {
    assert.doesNotMatch(pageCode, /Random Questions/);
    assert.match(pageSource, /Shuffled Order/);
  });

  await t.test('does not claim a "leaderboard" — no such view exists; uses the real Rank & Percentile result-page fields', () => {
    assert.doesNotMatch(pageCode, /[Ll]eaderboard/);
    assert.match(pageSource, /Rank & Percentile/);
  });

  await t.test('does not claim "Trusted & Updated" or "Most Popular" (unverifiable comparative/marketing claims)', () => {
    assert.doesNotMatch(pageCode, /Trusted & Updated/);
    assert.doesNotMatch(pageCode, /Most Popular/);
  });

  await t.test("badges reuse the app's existing per-category subtitle copy, not invented marketing text", () => {
    assert.match(pageSource, /EXAM_TYPE_META\.mock\.subtitle/);
    assert.match(pageSource, /EXAM_TYPE_META\.daily\.subtitle/);
    assert.match(pageSource, /EXAM_TYPE_META\.grand\.subtitle/);
    assert.match(pageSource, /EXAM_TYPE_META\.pyq\.subtitle/);
  });
});

test("access state is untouched (Steps 19-22)", async (t) => {
  await t.test("no access/entitlement/is_pro concept anywhere in the new files", () => {
    for (const src of [pageCode, stripComments(cardSource)]) {
      assert.doesNotMatch(src, /is_pro|can_start|can_continue|can_review|reason_code|upgrade_available|subscription\./);
    }
  });

  await t.test("this hub still fetches nothing — a pure static category catalog, exactly as before", () => {
    assert.doesNotMatch(pageSource, /api\.get|useEffect/);
    assert.doesNotMatch(cardSource, /api\.get|useEffect/);
  });

  await t.test("all four categories are unconditionally rendered — none hidden behind any state", () => {
    assert.doesNotMatch(pageSource, /EXAM_CATEGORIES\.filter/);
  });
});

test("bottom navigation is untouched by this page (Step 23)", async (t) => {
  await t.test("Exams page renders through the normal AppShell, not a bespoke nav", () => {
    assert.match(pageSource, /<AppShell>/);
    assert.doesNotMatch(pageSource, /BottomNav/);
  });
});

test("responsive / no-overflow safeguards (Step 29)", async (t) => {
  await t.test("card left panel is capped, not free-growing, to protect narrow-width layouts", () => {
    assert.match(cardSource, /max-w-\[124px\]/);
  });

  await t.test("the wide two-column hero mission copy is a progressive enhancement (hidden below sm), not forced onto phones", () => {
    assert.match(pageSource, /hidden -translate-y-1\/2 items-center gap-3 sm:flex/);
  });
});

test("accessibility (Steps 36-38)", async (t) => {
  await t.test("card has a single, concise accessible name instead of reading every chip", () => {
    assert.match(cardSource, /aria-label=\{`\$\{title\} — \$\{description\}`\}/);
  });

  await t.test("decorative visuals (panel icon, arrow) are hidden from assistive tech", () => {
    assert.match(cardSource, /aria-hidden="true"[\s\S]*flex-none flex-col items-center/);
    assert.match(cardSource, /aria-hidden="true"[\s\S]*ChevronRightIcon/);
  });

  await t.test("focus-visible styling is present on the card link", () => {
    assert.match(cardSource, /focus-visible:outline/);
  });

  await t.test("reduced-motion is inherited from the existing global rule, not a new local one", () => {
    assert.doesNotMatch(cardSource, /prefers-reduced-motion/);
  });
});
