/**
 * Registration Email + Confirm Email (email-verification-finalization
 * audit) — source assertions, matching this repository's own established
 * testing convention for JSX page files (see ../../components/AppShell.test.mjs's
 * own docstring: no jsdom/React Testing Library here, `node --test` can't
 * parse JSX, so these are structural checks on the real page source, not
 * rendered-output assertions).
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

test("registration form has a required Confirm Email field, separate from Email", () => {
  assert.match(code, /confirm_email:\s*""/, "form state must include confirm_email");
  assert.match(code, /Field label="Confirm Email"/);
  assert.match(code, /update\("confirm_email",/);
});

test("Confirm Email input is type=email and required, matching Email's own validation", () => {
  const confirmFieldBlock = code.slice(code.indexOf('Field label="Confirm Email"'), code.indexOf('Field label="Phone"'));
  assert.match(confirmFieldBlock, /type="email"/);
  assert.match(confirmFieldBlock, /required/);
});

test("submit rejects a mismatch client-side before ever calling register()", () => {
  const submitFn = code.slice(code.indexOf("async function handleSubmit"), code.indexOf("async function resendVerification"));
  const mismatchCheckIndex = submitFn.indexOf("form.email.trim().toLowerCase() !== form.confirm_email.trim().toLowerCase()");
  const registerCallIndex = submitFn.indexOf("await register(form)");
  assert.ok(mismatchCheckIndex !== -1, "must normalize (trim+lowercase) both fields before comparing");
  assert.ok(registerCallIndex !== -1, "must still call register() on success");
  assert.ok(mismatchCheckIndex < registerCallIndex, "the mismatch check must run BEFORE register() is ever called");
});

test("a successful registration never calls router.push immediately — it shows the success screen instead", () => {
  const submitFn = code.slice(code.indexOf("async function handleSubmit"), code.indexOf("async function resendVerification"));
  assert.doesNotMatch(submitFn, /router\.push/, "handleSubmit itself must not navigate away — Continue button does that");
  assert.match(submitFn, /setRegistered\(/);
});

test("success screen shows the registered email and both Continue and Resend actions, never claims verification is complete", () => {
  const successBlock = code.slice(code.indexOf("if (registered)"), code.indexOf("return (\n    <div className=\"flex min-h-dvh flex-col bg"));
  assert.match(successBlock, /\{registered\.email\}/);
  assert.match(successBlock, /Continue to Dr\. Gutka/);
  assert.match(successBlock, /Resend Verification Email/);
  assert.match(successBlock, /optional/i);
  assert.doesNotMatch(successBlock, /email verified/i, "must never claim verification already succeeded on this screen");
});

test("resend on the success screen calls the existing backend endpoint, not a new one", () => {
  assert.match(code, /api\.post\("\/auth\/resend-verification-email\/"\)/);
});

test("Program/Course default to CEE-UG/MBBS specifically, not just whichever course loads first", () => {
  const effectBlock = code.slice(code.indexOf('api\n      .get("/courses/")'), code.indexOf(".catch(() => {});"));
  assert.match(effectBlock, /program_group === "CEE-UG" && c\.prefix === "MBBS"/);
  // Falls back to the old "first available" behavior only if that exact course is missing.
  assert.match(effectBlock, /\|\| data\[0\]/);
});

test("Continue always works regardless of verification state — no verification gate before router.push", () => {
  const successBlock = code.slice(code.indexOf("if (registered)"), code.indexOf("if (registered)") + 4000);
  const continueButtonBlock = successBlock.slice(successBlock.indexOf("Continue to Dr. Gutka") - 300, successBlock.indexOf("Continue to Dr. Gutka"));
  assert.match(continueButtonBlock, /onClick=\{.*router\.push\("\/home"\).*\}/s);
});
