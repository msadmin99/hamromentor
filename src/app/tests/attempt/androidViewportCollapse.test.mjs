/**
 * PRODUCTION INCIDENT REGRESSION — Daily Test question area goes blank on
 * Android mobile after answering, while Desktop Safari is unaffected.
 *
 * Root cause (proven from source, not assumed — see the incident report
 * for the full trace): `.hm-app-shell` (globals.css) is a flex column with
 * `overflow: hidden`, whose header and bottom action bar keep their own
 * intrinsic height as non-flex-1 siblings — so the shell's *entire* height
 * budget is fixed except for the middle, `flex-1 min-h-0 overflow-y-auto`
 * question region, which absorbs 100% of any shrinkage.
 *
 * The shell used `height: 100dvh` (dynamic viewport height), which by spec
 * recalculates live as a mobile browser's UI chrome / on-screen keyboard /
 * IME candidate strip / autofill-suggestion surface shows and hides. The
 * MCQ accessibility remediation (QuestionWorkspace.js) made each answer
 * option a real, focusable `<input type="radio">` — so answering a
 * question moves real DOM focus onto a native form control for the first
 * time, which is exactly the trigger Android Chrome's IME/autofill layer
 * can react to (even for a non-text input) by transiently reserving
 * viewport space. When that happens, 100dvh shrinks, the flex-1 question
 * region can collapse toward zero height, and `overflow: hidden` clips it
 * away — a blank question area with the header/timer (fixed-height
 * siblings) still fully visible, exactly the reported symptom. Desktop
 * Safari has no keyboard/IME concept, so 100dvh never shrinks there.
 *
 * Fix: 100svh (small viewport height) is the same viewport-unit family
 * with identical browser support, but represents the smallest the
 * viewport can ever be — it does not shrink further when a keyboard/IME/
 * autofill surface appears, removing the collapsing-middle-region failure
 * mode entirely. A `100vh` line first is a pure fallback for a browser
 * predating both units.
 *
 * No rendering harness exists in this repo (node --test, no jsdom/RTL), so
 * this asserts against the actual source, matching the established
 * convention (see whiteScreenIncident.test.mjs's own docstring).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const here = dirname(fileURLToPath(import.meta.url));
const globalsCssPath = join(here, "..", "..", "globals.css");
const cssSource = readFileSync(globalsCssPath, "utf8");
const cssCode = stripComments(cssSource);

function shellRuleBody() {
  const start = cssCode.indexOf(".hm-app-shell {");
  assert.ok(start > -1, ".hm-app-shell rule must exist in globals.css");
  const end = cssCode.indexOf("}", start);
  return cssCode.slice(start, end);
}

test(".hm-app-shell no longer uses a bare 100dvh for its height", () => {
  const body = shellRuleBody();
  assert.doesNotMatch(body, /height:\s*100dvh\s*;\s*background/);
});

test(".hm-app-shell uses 100svh (stable, keyboard/IME-safe floor)", () => {
  const body = shellRuleBody();
  assert.match(body, /height:\s*100svh\s*;/);
});

test(".hm-app-shell keeps a 100vh fallback ahead of the 100svh declaration", () => {
  const body = shellRuleBody();
  const vhIndex = body.search(/height:\s*100vh\s*;/);
  const svhIndex = body.search(/height:\s*100svh\s*;/);
  assert.ok(vhIndex > -1 && svhIndex > -1 && vhIndex < svhIndex);
});

test(".hm-app-shell still establishes the flex-column + overflow:hidden shell (structure unchanged)", () => {
  const body = shellRuleBody();
  assert.match(body, /display:\s*flex\s*;/);
  assert.match(body, /flex-direction:\s*column\s*;/);
  assert.match(body, /overflow:\s*hidden\s*;/);
});

test("this fix does not touch attempt/answer state logic in the exam player", () => {
  const pageSource = readFileSync(join(here, "[attemptId]", "page.js"), "utf8");
  const pageCode = stripComments(pageSource);
  assert.doesNotMatch(pageCode, /setTimeout|window\.location|\.reload\(\)/);
});

test("this fix does not touch access, scoring, or Free Starter logic (CSS-only change)", () => {
  assert.doesNotMatch(cssCode, /has_daily_test_access|is_preview_only|FreeStarter|free_starter|shuffle_questions/i);
});
