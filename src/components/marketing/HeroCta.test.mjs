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

test("MCQ badge is a public feature: it always links straight to /mcq-of-the-day, no login/register gate", () => {
  const fn = code.slice(code.indexOf("export function HeroMcqBadge"));
  assert.match(fn, /<Link href="\/mcq-of-the-day"/);
  assert.doesNotMatch(fn, /\/login/);
  assert.doesNotMatch(fn, /\/register/);
  assert.doesNotMatch(fn, /\/qbank\/question\//);
});

test("MCQ badge never reads auth state at all — it is not conditional on being logged in", () => {
  const fn = code.slice(code.indexOf("export function HeroMcqBadge"));
  assert.doesNotMatch(fn, /useAuth\(\)/);
  assert.doesNotMatch(fn, /hasAuthenticatedBefore\(\)/);
});

test("neither CTA renders before auth state has resolved, except the always-public MCQ badge", () => {
  // Only the primary (private-destination) CTA needs to wait on auth
  // loading — the MCQ badge's destination never depends on it.
  const primaryFn = code.slice(code.indexOf("export function HeroPrimaryCta"), code.indexOf("export function HeroMcqBadge"));
  assert.match(primaryFn, /if \(!href\) return null;/);
});
