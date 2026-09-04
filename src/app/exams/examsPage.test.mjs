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
    assert.match(pageSource, /<Header\s+title="Exams"/);
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
    // page: no sm:grid-cols-2 (or similar), and no `grid` display at all —
    // a plain flex-col stack of full-width cards.
    assert.match(pageSource, /flex w-full max-w-6xl flex-col/);
    assert.doesNotMatch(pageSource, /grid-cols-2/);
    assert.doesNotMatch(pageSource, /className="[^"]*\bgrid\b/);
  });

  await t.test("the whole card is one real link — no clickable div, no nested link-in-button", () => {
    assert.match(cardSource, /import Link from "next\/link"/);
    assert.match(cardSource, /<Link[\s\S]*href=\{href\}/);
    assert.doesNotMatch(cardSource, /onClick=\{.*router\.push/);
  });

  await t.test("left visual panel exists", () => {
    assert.match(cardSource, /<Icon className="h-\[clamp\(/);
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
    assert.match(cardSource, /max-w-\[100px\]/);
  });

  await t.test("the wide two-column hero mission copy is a progressive enhancement (hidden below sm), not forced onto phones", () => {
    assert.match(pageSource, /hidden -translate-y-1\/2 items-center gap-3 sm:flex/);
  });
});

test("single-viewport composition (Mobile Exams Hub Single-Viewport Update)", async (t) => {
  await t.test("no carousel/pager/scroll-snap library or pattern anywhere in the new files", () => {
    for (const src of [pageSource, cardSource]) {
      assert.doesNotMatch(src, /carousel|swiper|pager|scroll-snap|snap-x|snap-y|snap-mandatory|IntersectionObserver/i);
    }
  });

  await t.test("no hard overflow-hidden clip on the cards container — compression, not clipping, is how this fits", () => {
    // Deliberate: a forced overflow:hidden here could silently hide Grand
    // Test/PYQ if the height budget is ever slightly wrong on some real
    // device, which this task's own rules forbid more strongly than the
    // no-scroll goal permits. See the deployment report's root-cause
    // section for the full reasoning.
    assert.doesNotMatch(pageCode, /overflow-hidden|overflow-y-hidden/);
  });

  await t.test("no JS-measured viewport height — the fit is pure CSS (clamp/padding), not a resize listener", () => {
    assert.doesNotMatch(pageCode, /window\.innerHeight|ResizeObserver|addEventListener\(.resize/);
    assert.doesNotMatch(stripComments(cardSource), /window\.innerHeight|ResizeObserver|addEventListener\(.resize/);
  });

  await t.test("Header renders in its compact `dense` mode only on this page", () => {
    assert.match(pageSource, /<Header\s+title="Exams"[\s\S]*?\bdense\b/);
    // Every other Header caller in the app is untouched by the dense prop.
    assert.doesNotMatch(headerSource, /dense = true/);
  });

  await t.test("card internals use clamp() so they compress at narrow widths instead of a single fixed size", () => {
    const clampCount = (cardSource.match(/clamp\(/g) || []).length;
    assert.ok(clampCount >= 4, `expected several clamp()-sized properties, found ${clampCount}`);
  });

  await t.test("chips and the arrow CTA share one row (not two), a real structural compression", () => {
    // The chips list and the arrow are both direct children of one
    // `justify-between` row, and the arrow is no longer on its own
    // `mt-*` row of its own (the pre-compression layout).
    // The chips list and the arrow sit close together in one row, not on
    // two separate rows (the pre-compression layout had the arrow on its
    // own `mt-*`-offset row, checked below).
    assert.match(cardSource, /flex-wrap gap-x-1 gap-y-0\.5[\s\S]{0,1000}ChevronRightIcon/);
    assert.doesNotMatch(cardSource, /mt-1 flex h-8 w-8/);
  });

  await t.test("no card is hidden or dropped at any breakpoint — same four categories, always", () => {
    const matches = pageSource.match(/href: "\/(mock-test|daily-test|grand-test|past-year-questions)"/g) || [];
    assert.equal(matches.length, 4);
    assert.doesNotMatch(pageCode, /\bhidden\b[^)]*(mock-test|daily-test|grand-test|past-year-questions)/);
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
