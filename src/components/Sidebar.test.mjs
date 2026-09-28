/**
 * Sidebar — desktop nav rail. Source assertions (see
 * ../app/register/registerEmailConfirmation.test.mjs's identical docstring
 * for why: no JSX rendering harness in this repo).
 *
 * Desktop audit (2026-09-28): the private NAV list + Profile/Log out
 * footer must never render for an anonymous visitor — this only became
 * reachable once /mcq-of-the-day became a public, no-login page that
 * still renders through AppShell/Sidebar.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(readFileSync(join(here, "Sidebar.js"), "utf8"));

test("the private NAV list and Profile/Log out footer only render when a user is present", () => {
  assert.match(code, /\{user \? \(/);
  const authedBranch = code.slice(code.indexOf("{user ? ("), code.indexOf(") : ("));
  assert.match(authedBranch, /\{NAV\.map/);
  assert.match(authedBranch, /Log out/);
});

test("the anonymous branch never renders the private NAV list, Profile menu, or Log out", () => {
  const anonBranch = code.slice(code.indexOf(") : ("), code.lastIndexOf(")}"));
  assert.doesNotMatch(anonBranch, /\{NAV\.map/);
  assert.doesNotMatch(anonBranch, /<ProfileMenu/);
  assert.doesNotMatch(anonBranch, /Log out/);
});

test("the anonymous branch still offers real public navigation, not an empty sidebar", () => {
  const anonBranch = code.slice(code.indexOf(") : ("), code.lastIndexOf(")}"));
  assert.match(anonBranch, /href="\/mcq-of-the-day"/);
  assert.match(anonBranch, /href="\/courses"/);
});

test("the anonymous branch offers a real login/register action instead of a non-functional Log out", () => {
  const anonBranch = code.slice(code.indexOf(") : ("), code.lastIndexOf(")}"));
  assert.match(anonBranch, /hasAuthenticatedBefore\(\) \? "\/login" : "\/register"/);
  assert.match(anonBranch, /hasAuthenticatedBefore\(\) \? "Log in" : "Create free account"/);
});

test("authenticated-page callers are unaffected: Sidebar itself still reads real `user` from useAuth, not a hardcoded default", () => {
  assert.match(code, /const \{ user, logout \} = useAuth\(\);/);
});
