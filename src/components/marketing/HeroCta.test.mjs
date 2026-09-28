/**
 * HeroCta (marketing landing page) — source assertions, matching this
 * repo's own established convention for JSX files (no jsdom/RTL harness
 * here; see ../../app/register/registerEmailConfirmation.test.mjs's
 * identical docstring for why).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(readFileSync(join(here, "HeroCta.js"), "utf8"));
const nav = stripComments(readFileSync(join(here, "..", "MarketingNav.js"), "utf8"));

test("primary CTA uses the same smart-destination rule MarketingNav's own CTA already uses", () => {
  assert.match(code, /user \? "\/home" : hasAuthenticatedBefore\(\) \? "\/login" : "\/register"/);
  assert.match(nav, /user \? "\/home" : hasAuthenticatedBefore\(\) \? "\/login" : "\/register"/);
});

test("primary CTA relabels itself when it points at the dashboard, never says 'Get Started' to a logged-in visitor", () => {
  const fn = code.slice(code.indexOf("export function HeroPrimaryCta"), code.indexOf("export function HeroMcqBadge"));
  assert.match(fn, /href === "\/home" \? "Go to Dashboard" : text/);
});

test("MCQ badge goes to the new choose-a-program flow when logged in, not straight to a single question", () => {
  const fn = code.slice(code.indexOf("export function HeroMcqBadge"));
  assert.match(fn, /user \? "\/mcq-of-the-day"/);
  assert.doesNotMatch(fn, /\/qbank\/question\//);
});

test("MCQ badge falls back to the same login/register logic as the primary CTA when logged out", () => {
  const fn = code.slice(code.indexOf("export function HeroMcqBadge"));
  assert.match(fn, /hasAuthenticatedBefore\(\) \? "\/login" : "\/register"/);
});

test("neither CTA renders (and never guesses a destination) before auth state has resolved", () => {
  assert.match(code, /if \(!href\) return null;/);
});
