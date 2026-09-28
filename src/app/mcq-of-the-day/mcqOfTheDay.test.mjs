/**
 * "MCQ of the Day" — public, no-login choose-a-program-then-5-MCQs page.
 * Source assertions (see ../register/registerEmailConfirmation.test.mjs's
 * identical docstring for why: no JSX rendering harness in this repo).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(readFileSync(join(here, "page.js"), "utf8"));

test("the page is public — no RequireAuth wrapper, no login/register gate anywhere", () => {
  assert.doesNotMatch(code, /RequireAuth/);
  assert.doesNotMatch(code, /\/login/);
  assert.doesNotMatch(code, /\/register/);
});

test("with no course chosen yet, shows the program picker instead of fetching a daily set", () => {
  const fn = code.slice(code.indexOf("function McqOfTheDayContent"), code.indexOf("function McqOfTheDayContent") + 3000);
  assert.match(fn, /if \(!coursePrefix\) \{/);
  assert.match(fn, /<ProgramPicker/);
});

test("choosing a program navigates via a course query param, not silent state", () => {
  assert.match(code, /router\.push\(`\/mcq-of-the-day\?course=\$\{encodeURIComponent\(prefix\)\}`\)/);
});

test("fetches the real public backend endpoint for the chosen course", () => {
  assert.match(code, /api\s*\n?\s*\.get\(`\/mcq-of-the-day-set\/\?course=\$\{encodeURIComponent\(coursePrefix\)\}`\)/);
});

test("renders the 5 questions with PublicMcqQuiz, not the authenticated QuestionSolver", () => {
  assert.match(code, /import PublicMcqQuiz from "@\/components\/PublicMcqQuiz"/);
  assert.doesNotMatch(code, /QuestionSolver/);
  assert.match(code, /<PublicMcqQuiz\s+questions=\{dailySet\.questions\}/);
});

test("program picker groups courses by program_group, matching the register page's own grouping convention", () => {
  const picker = code.slice(code.indexOf("function ProgramPicker"), code.indexOf("function McqOfTheDayContent"));
  assert.match(picker, /c\.program_group \|\| "Other"/);
});

test("program picker never pre-selects a program (e.g. the CEE-UG/MBBS default) — the visitor must choose explicitly", () => {
  const picker = code.slice(code.indexOf("function ProgramPicker"), code.indexOf("function McqOfTheDayContent"));
  assert.doesNotMatch(picker, /CEE-UG/);
  assert.doesNotMatch(picker, /MBBS/);
});

test("an empty daily set is explained, never rendered as a silently broken quiz", () => {
  assert.match(code, /dailySet\.questions\.length === 0/);
});

test("Change Program returns to the picker by navigating away from the course param, not local-only state", () => {
  assert.match(code, /function changeProgram\(\) \{ router\.push\("\/mcq-of-the-day"\); \}/);
});

test("a failed fetch shows an inline error, never a login/register/subscription wall", () => {
  assert.match(code, /catch\(\(err\) => setError\(err\.message/);
  assert.doesNotMatch(code, /subscription/i);
  assert.doesNotMatch(code, /purchase/i);
  assert.doesNotMatch(code, /\/plans/);
  assert.doesNotMatch(code, /upgrade/i);
});

test("passes the chosen course prefix through to PublicMcqQuiz, so its submission can be graded against the right course", () => {
  const contentFn = code.slice(code.indexOf("function McqOfTheDayContent"));
  assert.match(contentFn, /<PublicMcqQuiz[\s\S]*?coursePrefix=\{coursePrefix\}/);
});
