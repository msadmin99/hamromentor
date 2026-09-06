/**
 * PRODUCTION INCIDENT REGRESSION — Daily Test "exam error" on submit.
 *
 * Root cause: a Daily Test attempt that the server correctly refuses to
 * finalize (a preview-only Pro Daily Test's SubmitTestView 402 "Subscribe
 * to submit this test.", or any other denial) used to be swallowed by a
 * bare `catch { submittedRef.current = false; setSubmitting(false); }` in
 * AttemptContent.submitTest — the student saw the Submit button silently
 * reset with zero explanation and retried indefinitely (confirmed in
 * production logs: the same attempt id repeatedly hit
 * /attempts/{id}/submit/, every time answered 402, every time discarded
 * here). No rendering harness exists in this repo (node --test, no jsdom/
 * RTL — see mcqSemantics.test.mjs's own docstring for why), so this
 * asserts against the actual page/component source rather than a
 * rendered tree, matching the established convention.
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
const pageSource = readFileSync(join(here, "[attemptId]", "page.js"), "utf8");
const pageCode = stripComments(pageSource); // this file's own comments legitimately quote the old buggy pattern as documentation
const modalSource = readFileSync(
  join(here, "..", "..", "..", "components", "testplayer", "ReviewAnswersModal.js"),
  "utf8",
);

test("submitTest no longer has a bare, silent catch block", () => {
  assert.doesNotMatch(
    pageCode,
    /catch\s*\{\s*submittedRef\.current\s*=\s*false;\s*setSubmitting\(false\);\s*\}/,
    "submitTest's catch must not silently reset with no explanation — this is the exact incident regression.",
  );
});

test("a failed submit sets a visible error message from the server's response", () => {
  assert.match(pageCode, /setSubmitError\(err\.message/);
});

test("submitError is cleared on a fresh submit attempt", () => {
  assert.match(pageCode, /setSubmitError\(""\)/);
});

test("an already-auto-submitted attempt (exam_closed) redirects to the result page instead of showing an error", () => {
  assert.match(pageCode, /err\.data\?\.code\s*===\s*"exam_closed"/);
  // The exam_closed branch must push to the result route, not just clear state.
  const closedIndex = pageCode.indexOf('err.data?.code === "exam_closed"');
  const closedBranch = pageCode.slice(closedIndex, closedIndex + 200);
  assert.match(closedBranch, /router\.push\(`\/tests\/result\/\$\{attemptId\}`\)/);
});

test("ReviewAnswersModal accepts and renders an error prop", () => {
  assert.match(modalSource, /error\s*[,}]/); // present in the destructured props
  assert.match(modalSource, /\{error &&/);
});

test("the error banner reuses the existing warning-banner styling, not a new ad hoc style", () => {
  // Matches the same classes the pre-existing unansweredCount banner uses,
  // so this doesn't introduce a second, inconsistent error-styling convention.
  assert.match(modalSource, /bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red/g);
  const matches = modalSource.match(/bg-brand-red-light px-3 py-2 text-xs font-medium text-brand-red/g) || [];
  assert.ok(matches.length >= 2, "expected both the unanswered-count banner and the new error banner to share this style");
});

test("this fix does not touch SubmitTestView's own decision logic (frontend-only change)", () => {
  // Structural guard against scope creep: the incident's root access
  // decision (preview-only 402, exam_closed 403) must remain entirely
  // server-owned — this file only ever reads err.message/err.data.code
  // from a response the backend already produced, never invents its own
  // verdict about whether the submit should have succeeded.
  assert.doesNotMatch(pageCode, /has_daily_test_access|is_preview_only|FreeStarter|free_starter/i);
});
