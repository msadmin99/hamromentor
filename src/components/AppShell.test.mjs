/**
 * Second-stage mobile-scroll fix regression guard.
 *
 * This repository has no DOM/rendering test infrastructure (tests run
 * under `node --test`, with no jsdom or React Testing Library, and every
 * file under test here contains JSX, which plain Node can't parse/import
 * directly — see the same pattern in mcqSemantics.test.mjs). These are
 * therefore source assertions on AppShell.js/qbank's page.js rather than
 * rendered-output assertions.
 *
 * What actually matters and is pinned here: on QBank, Header must be
 * structurally OUTSIDE the scroll region (not just visually, via CSS) —
 * that's the fix for the real-device "content blanks mid-scroll,
 * reappears on scroll back" bug that survived the first-stage h-svh fix.
 * AppShell's `header` prop is deliberately explicit-only (no automatic
 * detection of a <Header> child), so only QBank is affected by this
 * change — every other AppShell caller keeps its current behavior
 * untouched. A source assertion proves the JSX is shaped correctly; it
 * does not prove the mobile compositing bug is gone on a real device —
 * that still needs the on-device retest this fix is going out for.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");
// Comments legitimately discuss the old h-dvh class by name (that's the
// point of the fix's own documentation) — strip them before asserting on
// actual code, matching the same pattern grandTestIntegration.test.mjs uses.
const stripComments = (src) => src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

const appShell = read("AppShell.js");
const appShellCode = stripComments(appShell);
const qbankPage = read("../app/qbank/page.js");
const qbankPageCode = stripComments(qbankPage);

test("AppShell's header prop is explicit-only, no automatic child detection", async (t) => {
  await t.test("accepts an explicit `header` prop, defaulting to null", () => {
    assert.match(appShellCode, /function AppShell\(\{[^}]*\bheader\s*=\s*null\b[^}]*\}\)/);
  });

  await t.test("does NOT import Header or compare child.type against it", () => {
    // Explicit-slot-only per this revision: no Header import, no
    // Children/isValidElement usage, no type-detection logic at all.
    assert.doesNotMatch(appShellCode, /import Header/);
    assert.doesNotMatch(appShellCode, /child\.type/);
    assert.doesNotMatch(appShellCode, /isValidElement/);
    assert.doesNotMatch(appShellCode, /Children\.toArray/);
  });

  await t.test("`header` is rendered BEFORE the overflow-y-auto scroll div opens, not inside it", () => {
    const headerSlotIndex = appShellCode.indexOf("{header}");
    const scrollDivIndex = appShellCode.indexOf("overflow-y-auto");
    assert.ok(headerSlotIndex !== -1, "{header} must be rendered somewhere");
    assert.ok(scrollDivIndex !== -1, "the overflow-y-auto scroll div must exist");
    assert.ok(
      headerSlotIndex < scrollDivIndex,
      "{header} must appear in the JSX before the scroll div — i.e. as a sibling above it, not a descendant"
    );
  });

  await t.test("{children} (the page content, untouched) is what's rendered inside the scroll div", () => {
    const scrollDivIndex = appShellCode.indexOf("overflow-y-auto");
    const scrollDivBlock = appShellCode.slice(scrollDivIndex, scrollDivIndex + 400);
    assert.match(scrollDivBlock, /\{children\}/);
  });

  await t.test("exactly one overflow-y-auto in the whole shell (still a single scroll container)", () => {
    const count = (appShellCode.match(/overflow-y-auto/g) || []).length;
    assert.equal(count, 1);
  });

  await t.test("Header is never given position:fixed or a hardcoded height as a workaround", () => {
    assert.doesNotMatch(appShellCode, /header[\s\S]{0,80}fixed/i);
  });

  await t.test("BottomNav is completely unchanged — still fixed, still out of flow", () => {
    assert.match(appShellCode, /showNav && <BottomNav \/>/);
    assert.match(appShellCode, /pb-\[calc\(var\(--mobile-bottom-nav-height\)/);
  });

  await t.test("no scroll/resize/IntersectionObserver/requestAnimationFrame logic was added", () => {
    assert.doesNotMatch(appShellCode, /addEventListener\(.(scroll|resize)./);
    assert.doesNotMatch(appShellCode, /IntersectionObserver/);
    assert.doesNotMatch(appShellCode, /requestAnimationFrame/);
  });

  await t.test("h-svh is retained from the first-stage fix (not reverted)", () => {
    assert.match(appShellCode, /h-svh/);
    assert.doesNotMatch(appShellCode, /h-dvh/);
  });
});

test("QBank page passes Header via the explicit header prop", async (t) => {
  await t.test("passes header={<Header .../>} to AppShell", () => {
    assert.match(qbankPageCode, /<AppShell\s*\n?\s*header=\{/);
  });

  await t.test("Header is not also left as a direct AppShell child alongside page content", () => {
    // The old (pre-fix) shape was "<AppShell>\n  <Header" — Header as the
    // first child, inside the scroll region. That shape must not recur.
    assert.doesNotMatch(qbankPageCode, /<AppShell>\s*<Header/);
  });

  await t.test("every existing Header prop this page used is preserved", () => {
    for (const prop of ["title=\"Dr Gutka\"", "right={", "courseSwitcher={<CourseSwitcher", "aria-label=\"Bookmarks\""]) {
      assert.ok(qbankPageCode.includes(prop), `missing preserved prop/markup: ${prop}`);
    }
  });
});

test("The other 38 AppShell callers are unaffected by this change", async (t) => {
  await t.test("AppShell has no fallback/auto-detection path that could alter their existing <Header> child", () => {
    // Covered structurally by the "does NOT import Header" assertion
    // above — with no detection logic present at all, a caller that
    // still renders <Header> as a plain child (every page except QBank)
    // is guaranteed to keep rendering it exactly where it always has:
    // inside {children}, inside the scroll region, unchanged.
    assert.doesNotMatch(appShellCode, /findIndex/);
  });
});
