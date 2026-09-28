/**
 * PublicMcqQuiz — anonymous quiz UI (select, change answer, Submit Test)
 * that defers ALL grading/reveal to the backend. Source assertions (see
 * ../app/register/registerEmailConfirmation.test.mjs's identical
 * docstring for why: no JSX rendering harness in this repo).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(readFileSync(join(here, "PublicMcqQuiz.js"), "utf8"));

test("initial (pre-submit) view never computes or reads is_correct — grading is entirely server-side", () => {
  const preSubmit = code.slice(0, code.indexOf("async function doSubmit"));
  assert.doesNotMatch(preSubmit, /is_correct/);
});

test("selecting an option can be changed before submission — it's a plain overwritable state update", () => {
  assert.match(code, /setAnswers\(\(prev\) => \(\{ \.\.\.prev, \[q\.id\]: optionId \}\)\)/);
});

test("shows an Answered: X/5 style counter", () => {
  assert.match(code, /Answered: \{answeredCount\}\/\{questions\.length\}/);
});

test("warns before submitting with unanswered questions, and only submits immediately once all are answered", () => {
  assert.match(code, /if \(answeredCount < questions\.length\) \{\s*setConfirmingSubmit\(true\);/);
  assert.match(code, /Submit anyway\?/);
});

test("has a distinct 'Submit Anyway' confirmation action that doesn't require re-answering anything", () => {
  assert.match(code, /Submit Anyway/);
});

test("submits every question's answer (or null) to the public POST endpoint, never a client-computed score", () => {
  assert.match(code, /api\.post\("\/mcq-of-the-day-set\/", payload\)/);
  assert.match(code, /answers: questions\.map\(\(q\) => \(\{ question_id: q\.id, option_id: answers\[q\.id\] \?\? null \}\)\)/);
});

test("result view renders directly from the backend's graded response, not from local answers state", () => {
  assert.match(code, /function PublicMcqResults\(\{ result, onFinish, finishLabel \}\)/);
  assert.match(code, /const questions = result\.questions;/);
});

test("result summary reports Score, Correct, Incorrect, and Unanswered counts from the server response", () => {
  assert.match(code, /Score: \{result\.score\}\/\{result\.total\}/);
  assert.match(code, /Correct: \{result\.correct_count\}/);
  assert.match(code, /Incorrect: \{result\.incorrect_count\}/);
  assert.match(code, /Unanswered: \{result\.unanswered_count\}/);
});

test("reuses ExplanationDisplay for solutions rather than inventing a new explanation renderer", () => {
  assert.match(code, /import ExplanationDisplay from "\.\/ExplanationDisplay"/);
  assert.match(code, /<ExplanationDisplay/);
});

test("reuses OptionResultBar for the per-option result rows, matching the authenticated QBank result styling", () => {
  assert.match(code, /import OptionResultBar from "\.\/OptionResultBar"/);
  assert.match(code, /<OptionResultBar/);
});

test("does not import QuestionSolver or otherwise trigger its authenticated side effects (bookmarks/confidence/answer POST)", () => {
  assert.doesNotMatch(code, /QuestionSolver/);
  assert.doesNotMatch(code, /bookmark/i);
  assert.doesNotMatch(code, /confidence/i);
  assert.doesNotMatch(code, /questions\/\$\{.*\}\/answer/);
});

test("a submission failure surfaces a retry action instead of silently losing the visitor's answers", () => {
  assert.match(code, /setSubmitError\(true\)/);
  assert.match(code, /Try Again/);
});

test("results view shows both the visitor's own answer and the correct answer per question", () => {
  assert.match(code, /Your answer: \{q\.is_answered \? letterFor\(selectedIdx\) : "—"\}/);
  assert.match(code, /Correct answer: \{correctIdx > -1 \? letterFor\(correctIdx\) : "—"\}/);
});
