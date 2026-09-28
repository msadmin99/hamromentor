/**
 * "MCQ of the Day" — choose a program, then 5 program-scoped MCQs.
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

test("the whole page requires authentication", () => {
  const exportBlock = code.slice(code.indexOf("export default function McqOfTheDayPage"));
  assert.match(exportBlock, /<RequireAuth>/);
});

test("with no course chosen yet, shows the program picker instead of fetching a daily set", () => {
  const fn = code.slice(code.indexOf("function McqOfTheDayContent"), code.indexOf("function McqOfTheDayContent") + 3000);
  assert.match(fn, /if \(!coursePrefix\) \{/);
  assert.match(fn, /<ProgramPicker/);
});

test("choosing a program navigates via a course query param, not silent state", () => {
  assert.match(code, /router\.push\(`\/mcq-of-the-day\?course=\$\{encodeURIComponent\(prefix\)\}`\)/);
});

test("fetches the real backend endpoint for the chosen course", () => {
  assert.match(code, /api\s*\n?\s*\.get\(`\/mcq-of-the-day-set\/\?course=\$\{encodeURIComponent\(coursePrefix\)\}`\)/);
});

test("renders the 5 questions with the existing QuestionSolver, not a new/duplicate question renderer", () => {
  assert.match(code, /import QuestionSolver from "@\/components\/QuestionSolver"/);
  assert.match(code, /<QuestionSolver\s*\n\s*questions=\{dailySet\.questions\}/);
});

test("program picker groups courses by program_group, matching the register page's own grouping convention", () => {
  const picker = code.slice(code.indexOf("function ProgramPicker"), code.indexOf("function McqOfTheDayContent"));
  assert.match(picker, /c\.program_group \|\| "Other"/);
});

test("an empty daily set is explained, never rendered as a silently broken QuestionSolver", () => {
  assert.match(code, /dailySet\.questions\.length === 0/);
});
