import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { isMatch, isMoreActive, isTabActive, MORE_MATCH_PREFIXES, PRIMARY_TABS } from "./bottomNav.js";

const here = dirname(fileURLToPath(import.meta.url));
const bottomNavSource = readFileSync(join(here, "..", "components", "BottomNav.js"), "utf8");
const moreMenuSource = readFileSync(join(here, "..", "components", "MoreMenu.js"), "utf8");
const examsPageSource = readFileSync(join(here, "..", "app", "exams", "page.js"), "utf8");

test("exactly five permanent bottom-nav items", async (t) => {
  await t.test("four primary tabs plus the More button", () => {
    // PRIMARY_TABS holds the four Link tabs; More is rendered separately
    // in BottomNav.js as the fifth item (a button, not a route of its
    // own) — together that's the required five.
    assert.equal(PRIMARY_TABS.length, 4);
    assert.match(bottomNavSource, />More</);
  });

  await t.test("Home exists", () => {
    assert.ok(PRIMARY_TABS.some((t2) => t2.label === "Home" && t2.href === "/home"));
  });

  await t.test("QBank exists", () => {
    assert.ok(PRIMARY_TABS.some((t2) => t2.label === "QBank" && t2.href === "/qbank"));
  });

  await t.test("Tests exists", () => {
    assert.ok(PRIMARY_TABS.some((t2) => t2.label === "Tests" && t2.href === "/exams"));
  });

  await t.test("Progress exists", () => {
    assert.ok(PRIMARY_TABS.some((t2) => t2.label === "Progress" && t2.href === "/performance"));
  });

  await t.test("More exists", () => {
    assert.match(bottomNavSource, /onClick=\{\(\) => setMenuOpen\(true\)\}/);
  });
});

test("REGRESSION: Practice is not the visible mobile label", async (t) => {
  await t.test("no tab uses the label Practice", () => {
    assert.ok(!PRIMARY_TABS.some((t2) => t2.label === "Practice"));
  });

  await t.test("the literal string never appears as a rendered label in BottomNav.js", () => {
    // Permanent guard: this must keep failing if anyone reverts the
    // label back to "Practice". Strips comments first so the file's own
    // explanatory prose (which legitimately mentions "Practice Question
    // Bank") can't hide a real regression from this check, and can't
    // cause a false failure either.
    const withoutComments = bottomNavSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(withoutComments, />Practice</);
  });

  await t.test("the QBank tab's visible label is exactly \"QBank\"", () => {
    const qbank = PRIMARY_TABS.find((t2) => t2.href === "/qbank");
    assert.equal(qbank.label, "QBank");
  });
});

test("REGRESSION: Bookmarks is not a permanent bottom-bar item", async (t) => {
  await t.test("no PRIMARY_TABS entry is Bookmarks", () => {
    assert.ok(!PRIMARY_TABS.some((t2) => t2.label === "Bookmarks" || t2.href === "/qbank/bookmarks"));
  });

  await t.test("Bookmarks is reachable from the More menu instead", () => {
    assert.match(moreMenuSource, /href: "\/qbank\/bookmarks", label: "Bookmarks"/);
  });
});

test("QBank route preservation", async (t) => {
  await t.test("the QBank tab still points at the existing Practice Question Bank route", () => {
    const qbank = PRIMARY_TABS.find((t2) => t2.label === "QBank");
    assert.equal(qbank.href, "/qbank");
  });
});

test("Tests hub contents", async (t) => {
  await t.test("the existing /exams hub lists all four exam types with real routes", () => {
    // Field renamed label -> title in the Mobile Exams Hub Visual Redesign
    // (each category is now a rich card, not a plain {href,label} row) —
    // same four routes/names, just matched against the new field name.
    assert.match(examsPageSource, /href: "\/mock-test",\s*\n\s*title: "Mock Test"/);
    assert.match(examsPageSource, /href: "\/daily-test",\s*\n\s*title: "Daily Test"/);
    assert.match(examsPageSource, /href: "\/grand-test",\s*\n\s*title: "Grand Test"/);
    assert.match(examsPageSource, /href: "\/past-year-questions",\s*\n\s*title: "Past Year Questions"/);
  });

  await t.test("Tests tab's matchPrefixes cover the hub and all four exam types", () => {
    const tests = PRIMARY_TABS.find((t2) => t2.label === "Tests");
    for (const p of ["/exams", "/mock-test", "/daily-test", "/grand-test", "/past-year-questions"]) {
      assert.ok(tests.matchPrefixes.includes(p), `missing ${p}`);
    }
  });
});

test("More menu contents", async (t) => {
  await t.test("contains the required secondary destinations", () => {
    assert.match(moreMenuSource, /href: "\/qbank\/bookmarks", label: "Bookmarks"/);
    assert.match(moreMenuSource, /href: "\/videos", label: "Videos"/);
    assert.match(moreMenuSource, /href: "\/courses", label: "Video Lecture Courses"/);
    assert.match(moreMenuSource, /href: "\/subscriptions", label: "My Subscriptions"/);
    assert.match(moreMenuSource, /href: "\/profile", label: "Profile"/);
  });

  await t.test("contains Log out, reusing the existing sign-out action", () => {
    assert.match(moreMenuSource, /Log out/);
    assert.match(moreMenuSource, /logout\(\)/);
    assert.match(moreMenuSource, /useAuth/);
  });

  await t.test("REGRESSION: MoreMenu's routes stay in sync with lib/bottomNav.js's MORE_MATCH_PREFIXES", () => {
    // These two lists are deliberately maintained separately (see
    // lib/bottomNav.js's own docstring on why) — this is the guard
    // against them drifting apart.
    for (const prefix of MORE_MATCH_PREFIXES) {
      assert.match(moreMenuSource, new RegExp(`href: "${prefix.replace(/\//g, "\\/")}"`), `MoreMenu.js is missing ${prefix}`);
    }
  });
});

test("active-route mapping", async (t) => {
  await t.test("Home route activates Home, nothing else", () => {
    const home = PRIMARY_TABS.find((t2) => t2.label === "Home");
    assert.equal(isTabActive(home, "/home"), true);
    for (const other of PRIMARY_TABS.filter((t2) => t2.label !== "Home")) {
      assert.equal(isTabActive(other, "/home"), false, `${other.label} incorrectly active on /home`);
    }
  });

  await t.test("QBank routes activate QBank", () => {
    const qbank = PRIMARY_TABS.find((t2) => t2.label === "QBank");
    assert.equal(isTabActive(qbank, "/qbank"), true);
    assert.equal(isTabActive(qbank, "/qbank/practice"), true);
    assert.equal(isTabActive(qbank, "/qbank/mistakes"), true);
  });

  await t.test("QBank does NOT activate on /qbank/bookmarks (that's More's territory now)", () => {
    const qbank = PRIMARY_TABS.find((t2) => t2.label === "QBank");
    assert.equal(isTabActive(qbank, "/qbank/bookmarks"), false);
    assert.equal(isMoreActive("/qbank/bookmarks"), true);
  });

  await t.test("Mock/Daily/Grand/PYQ routes activate Tests", () => {
    const tests = PRIMARY_TABS.find((t2) => t2.label === "Tests");
    for (const path of ["/exams", "/mock-test", "/mock-test/5", "/daily-test", "/grand-test", "/past-year-questions", "/past-year-questions/iom"]) {
      assert.equal(isTabActive(tests, path), true, `Tests should be active on ${path}`);
    }
  });

  await t.test("Performance routes activate Progress", () => {
    const progress = PRIMARY_TABS.find((t2) => t2.label === "Progress");
    assert.equal(isTabActive(progress, "/performance"), true);
    assert.equal(isTabActive(progress, "/performance/subjects/3"), true);
  });

  await t.test("Bookmarks/Videos/Courses/Subscriptions/Profile activate More", () => {
    for (const path of ["/qbank/bookmarks", "/videos", "/courses", "/subscriptions", "/profile", "/profile/edit"]) {
      assert.equal(isMoreActive(path), true, `More should be active on ${path}`);
    }
  });

  await t.test("unrelated routes activate nothing", () => {
    for (const tab of PRIMARY_TABS) {
      assert.equal(isTabActive(tab, "/settings"), false, `${tab.label} incorrectly active on /settings`);
    }
    assert.equal(isMoreActive("/settings"), false);
  });

  await t.test("string-prefix collisions do not falsely match (e.g. /examsomething is not /exams)", () => {
    assert.equal(isMatch("/examsomething", ["/exams"]), false);
    assert.equal(isMatch("/exams", ["/exams"]), true);
    assert.equal(isMatch("/exams/1", ["/exams"]), true);
  });
});

test("Tests menu closes after navigation", async (t) => {
  await t.test("Tests is a real link (navigates directly), not a menu that needs manual closing", () => {
    // Unlike More, Tests does not open an in-page menu — it navigates to
    // the existing /exams hub page, so there is no menu-close step to
    // verify: Next.js routing itself replaces the page.
    assert.match(bottomNavSource, /href=\{tab\.href\}/);
  });
});

test("More menu closes after navigation", async (t) => {
  await t.test("every MoreMenu link calls onClose on click", () => {
    assert.match(moreMenuSource, /onClick=\{onClose\}/);
  });

  await t.test("logout also calls onClose", () => {
    const handler = moreMenuSource.slice(moreMenuSource.indexOf("function handleLogout"), moreMenuSource.indexOf("return ("));
    assert.match(handler, /onClose\(\)/);
  });
});

test("Escape closes the More menu", async (t) => {
  await t.test("MoreMenu is built on the existing Drawer primitive, which already handles Escape via useDialogA11y", () => {
    assert.match(moreMenuSource, /import Drawer from "\.\/Drawer"/);
    assert.match(moreMenuSource, /<Drawer open onClose=\{onClose\}/);
  });
});

test("semantic markup", async (t) => {
  await t.test("the primary bar is a <nav> with an accessible label", () => {
    assert.match(bottomNavSource, /<nav aria-label="Primary navigation"/);
  });

  await t.test("the More menu's link list is also a labelled <nav>", () => {
    assert.match(moreMenuSource, /<nav aria-label="More"/);
  });

  await t.test("primary tabs are real links, not clickable divs", () => {
    assert.match(bottomNavSource, /<Link\s/);
    assert.doesNotMatch(bottomNavSource, /<div[^>]*onClick/);
  });

  await t.test("Tests/More triggers that perform an action use <button>", () => {
    assert.match(bottomNavSource, /<button\s+type="button"\s+onClick=\{\(\) => setMenuOpen\(true\)\}/);
  });

  await t.test("More menu destination rows are real links, not clickable divs", () => {
    assert.match(moreMenuSource, /<Link\s/);
    assert.doesNotMatch(moreMenuSource, /<div[^>]*onClick/);
  });
});

test("accessible names", async (t) => {
  await t.test("every primary tab has visible text, not an icon-only control", () => {
    assert.match(bottomNavSource, /\{tab\.label\}/);
  });

  await t.test("active tabs expose aria-current", () => {
    assert.match(bottomNavSource, /aria-current=\{active \? "page" : undefined\}/);
  });

  await t.test("the More trigger exposes aria-haspopup/aria-expanded", () => {
    assert.match(bottomNavSource, /aria-haspopup="dialog"/);
    assert.match(bottomNavSource, /aria-expanded=\{menuOpen\}/);
  });
});

test("desktop and mobile stay separate", async (t) => {
  await t.test("the bottom nav is hidden at md breakpoint and above", () => {
    assert.match(bottomNavSource, /md:hidden/);
  });

  await t.test("BottomNav.js never touches components/Sidebar.js or its NAV array", () => {
    assert.doesNotMatch(bottomNavSource, /Sidebar/);
  });

  await t.test("MoreMenu is a separate component from the shared ProfileMenu (desktop is untouched)", () => {
    // Checked as an import/usage, not a bare word match — both files'
    // own comments legitimately name ProfileMenu when explaining why
    // they deliberately don't use it.
    assert.doesNotMatch(bottomNavSource, /import ProfileMenu|<ProfileMenu/);
    assert.doesNotMatch(moreMenuSource, /import ProfileMenu|<ProfileMenu/);
  });
});

test("performance: no data fetching for navigation itself", async (t) => {
  await t.test("lib/bottomNav.js has no imports at all — pure config and route matching only", () => {
    const libSource = readFileSync(join(here, "bottomNav.js"), "utf8");
    assert.doesNotMatch(libSource, /^import /m);
  });

  await t.test("BottomNav.js makes no API calls — active state comes from pathname alone", () => {
    assert.doesNotMatch(bottomNavSource, /\bapi\.(get|post)\(/);
    assert.doesNotMatch(bottomNavSource, /fetch\(/);
  });
});

test("access control is untouched by navigation", async (t) => {
  await t.test("neither nav file references any capability, entitlement, or Free Starter concept", () => {
    const forbidden = /CanStart|CanView|CanContinue|CanReview|entitlement|FreeStarter|subscription\.|is_pro/i;
    assert.doesNotMatch(bottomNavSource, forbidden);
    assert.doesNotMatch(moreMenuSource, forbidden);
  });
});
