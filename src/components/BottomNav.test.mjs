/**
 * BottomNav — mobile nav bar. Source assertions (see
 * ../app/register/registerEmailConfirmation.test.mjs's identical docstring
 * for why: no JSX rendering harness in this repo).
 *
 * Desktop audit (2026-09-28): the same anonymous/authenticated split
 * Sidebar.js got, applied to the mobile bottom bar — PRIMARY_TABS and the
 * More menu (bookmarks, subscriptions, profile, Log out) must not render
 * for an anonymous visitor on the now-public /mcq-of-the-day page.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const stripComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const code = stripComments(readFileSync(join(here, "BottomNav.js"), "utf8"));

test("PRIMARY_TABS and the More button only render when a user is present", () => {
  assert.match(code, /\{user \? \(/);
  const authedBranch = code.slice(code.indexOf("{user ? ("), code.indexOf(") : ("));
  assert.match(authedBranch, /\{PRIMARY_TABS\.map/);
  assert.match(authedBranch, /setMenuOpen\(true\)/);
});

test("MoreMenu never mounts for an anonymous visitor, even if menuOpen were somehow true", () => {
  assert.match(code, /\{user && menuOpen && <MoreMenu/);
});

test("the anonymous branch offers real public navigation, not an empty bar", () => {
  const anonBranch = code.slice(code.indexOf(") : ("), code.lastIndexOf("</nav>"));
  assert.match(anonBranch, /href="\/mcq-of-the-day"/);
  assert.match(anonBranch, /href="\/courses"/);
});

test("the anonymous branch offers a real login/register action, not a non-functional More/Log out", () => {
  const anonBranch = code.slice(code.indexOf(") : ("), code.lastIndexOf("</nav>"));
  assert.match(anonBranch, /hasAuthenticatedBefore\(\) \? "\/login" : "\/register"/);
});
