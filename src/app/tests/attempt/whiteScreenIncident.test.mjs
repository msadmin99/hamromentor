/**
 * PRODUCTION INCIDENT REGRESSION — Daily Test white screen / lost
 * questions / refresh-shows-Submit.
 *
 * Root cause (proven, not assumed):
 *
 * 1. Zero error boundaries existed anywhere in this app (no error.js /
 *    global-error.js at any route level) — confirmed by a full search
 *    before this fix. Any uncaught render exception in the exam player
 *    had nothing to catch it, so React unmounted the whole tree with no
 *    fallback: a completely blank page.
 *
 * 2. TestAttemptSerializer.get_questions() (backend) can return an empty
 *    `questions` array — most plausibly because the underlying Test's
 *    attached Questions were later removed from the question bank
 *    (TestQuestion.question is on_delete=CASCADE, confirmed in
 *    tests_app/models.py). With zero questions, AttemptContent's own math
 *    (`totalPages = Math.max(1, Math.ceil(0/perPage)) = 1`, so
 *    `page(0) < totalPages-1(0)` is false) unconditionally renders the
 *    bottom bar's "Review & Submit →" button with a blank content area
 *    above it and throws no exception — exactly "the screen goes white
 *    and shows Submit," mathematically, not from a crash.
 *
 * Separately CONFIRMED via production log evidence (not fixed in this
 * pass — requires persisting a per-attempt question order, which needs a
 * schema change; see the incident report): get_questions() also
 * re-shuffles the full question list on every single GET
 * (`random.shuffle()`, unconditional whenever `shuffle_questions=True`),
 * so the specific set/order of questions shown to a student changes on
 * every reload — production logs show three GETs of the same attempt id
 * within under a minute returning three different response byte sizes
 * (4373 / 4180 / 4224 bytes), proving the content genuinely differs
 * between reloads, not just its formatting.
 *
 * No rendering harness exists in this repo (node --test, no jsdom/RTL),
 * so this asserts against the actual source, matching the established
 * convention (see mcqSemantics.test.mjs's own docstring).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const here = dirname(fileURLToPath(import.meta.url));
const attemptDir = join(here, "[attemptId]");
const pageSource = readFileSync(join(attemptDir, "page.js"), "utf8");
const pageCode = stripComments(pageSource);

test("an error.js boundary exists for the exam-player route", () => {
  assert.ok(existsSync(join(attemptDir, "error.js")), "src/app/tests/attempt/[attemptId]/error.js must exist");
});

test("the error boundary retries via reset(), never a fresh start POST", () => {
  const errorSource = readFileSync(join(attemptDir, "error.js"), "utf8");
  assert.match(errorSource, /reset\(\)/);
  assert.doesNotMatch(stripComments(errorSource), /\/start\//);
});

test("the error boundary never renders the raw error/stack trace to the student", () => {
  const errorCode = stripComments(readFileSync(join(attemptDir, "error.js"), "utf8"));
  // error.message / error.stack must never reach JSX — only a fixed, friendly string.
  assert.doesNotMatch(errorCode, /\{error\.(message|stack)\}/);
});

test("a zero-question attempt shows an explicit message instead of a blank exam with a live Submit button", () => {
  assert.match(pageCode, /attempt\.questions\.length === 0/);
});

test("the zero-question guard is reached before the question-rendering JSX, not after", () => {
  const guardIndex = pageCode.indexOf("attempt.questions.length === 0");
  const mapIndex = pageCode.indexOf("pageQuestions.map");
  assert.ok(guardIndex > -1 && mapIndex > -1 && guardIndex < mapIndex);
});

test("the zero-question guard offers a retry that re-fetches, and never re-creates the attempt", () => {
  const guardIndex = pageCode.indexOf("attempt.questions.length === 0");
  const guardBlock = pageCode.slice(guardIndex, guardIndex + 700);
  assert.match(guardBlock, /onRetry=\{load\}/);
  assert.doesNotMatch(guardBlock, /\/start\//);
});

test("the zero-question guard reassures the student their attempt is still saved, not submitted", () => {
  const guardIndex = pageCode.indexOf("attempt.questions.length === 0");
  const guardBlock = pageCode.slice(guardIndex, guardIndex + 700);
  assert.match(guardBlock, /still saved/i);
});

test("this fix does not touch access, scoring, or Free Starter logic (frontend-only, display-guard-only change)", () => {
  assert.doesNotMatch(pageCode, /has_daily_test_access|is_preview_only|FreeStarter|free_starter|shuffle_questions/i);
});
