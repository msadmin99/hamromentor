/**
 * Verification page — source assertions (see ../../register/registerEmailConfirmation.test.mjs's
 * identical docstring for why: no JSX rendering harness in this repo).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "page.js"), "utf8");
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(src);

test("calls the existing backend verify endpoint via POST, with auth disabled (works for a logged-out visitor too)", () => {
  assert.match(code, /api\s*\n?\s*\.post\(`\/auth\/verify-email\/\$\{encodeURIComponent\(token\)\}\/`,\s*undefined,\s*\{\s*auth:\s*false\s*\}\)/);
});

test("submits the token at most once, even across a fast remount", () => {
  assert.match(code, /submittedRef/);
  assert.match(code, /if \(submittedRef\.current \|\| !token\) return;/);
  assert.match(code, /submittedRef\.current = true;/);
});

test("refreshes the authenticated user's cached profile after success, without requiring logout/login", () => {
  const successHandler = code.slice(code.indexOf(".then(async"), code.indexOf(".catch("));
  assert.match(successHandler, /setState\("success"\)/);
  assert.match(successHandler, /await refresh\(\)/);
});

test("handles every distinct backend error code with its own copy: expired, already-used, invalid", () => {
  assert.match(code, /expired_token:\s*\{/);
  assert.match(code, /already_used:\s*\{/);
  assert.match(code, /invalid_token:\s*\{/);
});

test("an unrecognized/network error still renders something useful, never a blank page", () => {
  const errorState = code.slice(code.indexOf('state === "error" &&'), code.indexOf('</>\n        )}\n      </div>'));
  assert.match(errorState, /knownError\?\.title \|\| /, "must fall back when errorCode isn't one of the three known codes");
  assert.match(errorState, /knownError\?\.body \|\| errorMessage/);
});

test("the raw token is never passed to console/logging anywhere on this page", () => {
  assert.doesNotMatch(code, /console\.(log|error|warn|info|debug)/);
});

test("has a loading state distinct from success and error, shown before the API call resolves", () => {
  assert.match(code, /useState\("loading"\)/);
  assert.match(code, /state === "loading" &&/);
});

test("success and error screens both offer a way back into the app (Continue), regardless of outcome", () => {
  const successBlock = code.slice(code.indexOf('state === "success" &&'), code.indexOf('state === "error" &&'));
  const errorBlock = code.slice(code.indexOf('state === "error" &&'));
  assert.match(successBlock, /Continue to Dr\. Gutka/);
  assert.match(errorBlock, /Continue to Dr\. Gutka/);
});
