/**
 * EmailVerificationBanner + EmailVerificationSection — source assertions
 * (see ../app/register/registerEmailConfirmation.test.mjs's identical
 * docstring for why: no JSX rendering harness in this repo).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const banner = stripComments(readFileSync(join(here, "EmailVerificationBanner.js"), "utf8"));
const section = stripComments(readFileSync(join(here, "EmailVerificationSection.js"), "utf8"));

test("banner renders nothing while auth is loading, no user, or already verified", () => {
  assert.match(banner, /if \(loading \|\| !user \|\| user\.email_verified\) return null;/);
});

test("banner's resend button calls the existing backend endpoint, no second rate limiter", () => {
  assert.match(banner, /api\.post\("\/auth\/resend-verification-email\/"\)/);
  assert.doesNotMatch(banner, /setInterval|localStorage\.setItem\(.*throttle/i, "must not implement its own client-side rate limit");
});

test("banner surfaces a 429 with a distinct, non-technical message", () => {
  assert.match(banner, /err\.status === 429/);
});

test("settings' email card shows Verified or Not verified based on user.email_verified", () => {
  assert.match(section, /user\?\.email_verified \? \(/);
  assert.match(section, /Verified/);
  assert.match(section, /Not verified/);
});

test("resend button only appears for an unverified user, and only before it's been sent", () => {
  const jsx = section.slice(section.indexOf("return ("));
  assert.match(jsx, /!user\?\.email_verified && resendState !== "sent" && \(/);
});

test("change-email form validates Email vs Confirm Email match BEFORE calling the API", () => {
  const fn = section.slice(section.indexOf("async function submitChangeEmail"), section.indexOf("async function submitChangeEmail") + 700);
  const mismatchIndex = fn.indexOf("newEmail !== confirmEmail");
  const apiCallIndex = fn.indexOf('api.post("/auth/change-email/"');
  assert.ok(mismatchIndex !== -1);
  assert.ok(apiCallIndex !== -1);
  assert.ok(mismatchIndex < apiCallIndex, "mismatch must be checked before the API call, not after");
});

test("change-email uses the existing backend endpoint and required fields, and refreshes cached user state on success", () => {
  const fn = section.slice(section.indexOf("async function submitChangeEmail"));
  assert.match(fn, /api\.post\("\/auth\/change-email\/",\s*\{/);
  assert.match(fn, /current_password:\s*changeForm\.current_password/);
  assert.match(fn, /await refresh\(\);/);
});

test("change-email form explains the new address becomes unverified", () => {
  assert.match(section, /makes the new address unverified/);
});

test("change-email success message never claims the new address is already verified", () => {
  const successMsgLine = section.slice(section.indexOf('setChangeMsg("Email changed'), section.indexOf('setChangeMsg("Email changed') + 200);
  assert.doesNotMatch(successMsgLine, /is now verified|has been verified/i);
  assert.match(successMsgLine, /unverified/i);
});
