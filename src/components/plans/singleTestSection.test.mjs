/**
 * Unified Exam Catalog Visibility / Access remediation — regression guard
 * for the "paid user sees a false lock" defect found in the Grand Test
 * single-purchase catalog (the plans page).
 *
 * `SingleTestSection` used to compute ownership as
 * `ownedTestIds.has(t.id) || !t.is_pro`, where `ownedTestIds` came only
 * from a `grandTestAccess` prop — i.e. only direct `GrandTestAccess`
 * purchases. A student who held the same Grand Test through a
 * Subscription, Combo, Scholarship, or an admin assignment saw "Buy Now"
 * on a test they could already start.
 *
 * Source assertions, matching the pattern already established for the
 * MCQ remediation (components/testplayer/mcqSemantics.test.mjs) — this
 * repository has no DOM/rendering test infrastructure.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const fileContent = readFileSync(join(here, "SingleTestSection.js"), "utf8");
// Strip `//` line comments before asserting: the regressions this file
// guards against are explained in prose right next to the fix (including
// the exact old expression, for a future reader), which would otherwise
// make these assertions match their own explanatory comment.
const source = fileContent.replace(/\/\/.*$/gm, "");

test("Grand Test single-purchase card reads server-derived access", async (t) => {
  await t.test("REGRESSION: ownership is never inferred from is_pro", () => {
    // The exact defect: `!t.is_pro` treated every free (non-Pro) Grand
    // Test as owned and every Pro one as unowned, ignoring every real
    // entitlement source entirely.
    assert.doesNotMatch(source, /!t\.is_pro/, "ownership regressed to an is_pro-based inference");
    assert.doesNotMatch(source, /!test\.is_pro/);
  });

  await t.test("REGRESSION: ownership is never scoped to direct-purchase access alone", () => {
    // `grandTestAccess`/`ownedTestIds` was the client-supplied prop that
    // only ever carried direct GrandTestAccess purchases — a Subscription,
    // Combo, Scholarship, or assignment holder was invisible to it.
    assert.doesNotMatch(source, /grandTestAccess/);
    assert.doesNotMatch(source, /ownedTestIds/);
  });

  await t.test("ownership reads the server's access block", () => {
    assert.match(source, /t\.access\?\.can_start/);
  });

  await t.test("continuing an in-progress attempt is also treated as owned", () => {
    // A student mid-attempt must see "Start Test", not "Buy Now" — access
    // block's can_continue covers this.
    assert.match(source, /t\.access\?\.can_continue/);
  });

  await t.test("a reviewable completed attempt is also treated as owned", () => {
    assert.match(source, /t\.access\?\.can_review/);
  });
});
