/**
 * Phase 10 — tests for the student access-state presentation layer.
 *
 * Run with the repo's own script: `npm run test` (Node's built-in test
 * runner — no test dependencies were added to this app, which had none).
 *
 * These cover the pure decision→presentation mapping, which is where the
 * Phase 10 bug class lived (the card inferring lockedness from `is_pro`).
 * Component/DOM rendering is NOT covered — this app has no DOM test
 * harness; see PHASE_10_STUDENT_UX_COMPLETION_REPORT.md for exactly what
 * that leaves untested.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accessOf,
  cardPresentation,
  denialCopy,
  denialFor,
  isLocked,
  primaryHref,
  quotaFor,
  sourceLabel,
} from "./accessState.js";

const access = (over = {}) => ({
  state: "start",
  can_start: true,
  can_continue: false,
  can_review: false,
  reason_code: "",
  upgrade_available: false,
  source: "course_enrollment",
  attempts_left: 1,
  latest_attempt_id: null,
  in_progress_attempt_id: null,
  ...over,
});

const test_ = (accessOver = {}, rest = {}) => ({ id: 7, is_pro: true, ...rest, access: access(accessOver) });

describe("card presentation comes from the backend state, never from price", () => {
  it("shows Start for an entitled pro test", () => {
    const p = cardPresentation(test_({ state: "start" }, { is_pro: true }));
    assert.equal(p.cta, "Start Test");
    assert.equal(p.disabled, false);
  });

  it("a pro test the backend says is startable is NOT locked", () => {
    // The exact regression: is_pro used to imply locked, so subscribers,
    // scholarship holders and Free Starter users all saw a padlock.
    assert.equal(isLocked(test_({ state: "start" }, { is_pro: true })), false);
  });

  it("a free test the backend says is locked IS locked", () => {
    // The mirror image: price says free, the backend says no.
    assert.equal(isLocked(test_({ state: "locked", can_start: false }, { is_pro: false })), true);
  });

  it("shows Continue for an in-progress attempt", () => {
    const p = cardPresentation(test_({ state: "continue", can_start: false, can_continue: true }));
    assert.equal(p.cta, "Continue Test");
  });

  it("shows Review for a completed attempt", () => {
    const p = cardPresentation(test_({ state: "review", can_start: false, can_review: true }));
    assert.equal(p.cta, "Review Test");
  });

  it("disables the action for upcoming, closed and exhausted", () => {
    for (const state of ["upcoming", "closed", "attempts_exhausted"]) {
      assert.equal(cardPresentation(test_({ state, can_start: false })).disabled, true, state);
    }
  });

  it("gives every state a distinct label and icon, so state is never colour-only", () => {
    const states = ["continue", "review", "start", "upcoming", "closed", "attempts_exhausted", "locked"];
    const labels = states.map((s) => cardPresentation(test_({ state: s })).label);
    const icons = states.map((s) => cardPresentation(test_({ state: s })).icon);
    assert.equal(new Set(labels).size, states.length);
    assert.equal(new Set(icons).size, states.length);
  });

  it("falls back to a neutral state when the backend block is missing", () => {
    const p = cardPresentation({ id: 1, is_pro: true });
    assert.equal(p.disabled, false);
    assert.equal(accessOf({ id: 1 }).reason_code, "");
  });
});

describe("primary link", () => {
  it("review opens the actual result, not the detail page", () => {
    const t = test_({ state: "review", can_start: false, can_review: true, latest_attempt_id: 42 });
    assert.equal(primaryHref(t), "/tests/result/42");
  });

  it("everything else opens the detail page, where the server decides", () => {
    assert.equal(primaryHref(test_({ state: "start" })), "/tests/7");
    assert.equal(primaryHref(test_({ state: "locked", can_start: false })), "/tests/7");
  });
});

describe("denial copy distinguishes reasons instead of saying 'locked'", () => {
  it("free_limit_reached and purchase_required read differently", () => {
    const free = denialCopy("free_limit_reached");
    const paid = denialCopy("purchase_required");
    assert.notEqual(free.title, paid.title);
    assert.match(free.title, /free/i);
  });

  it("every reason code the backend can emit has real copy", () => {
    const codes = [
      "free_limit_reached",
      "purchase_required",
      "subscription_expired",
      "exam_not_open",
      "exam_closed",
      "attempt_limit_reached",
      "registration_required",
      "password_required",
      "authentication_required",
      "assignment_required",
      "not_entitled",
    ];
    for (const code of codes) {
      const copy = denialCopy(code);
      assert.ok(copy && copy.title && copy.body, code);
      assert.ok(!copy.title.includes("_"), `${code}: raw reason code leaked into user copy`);
    }
  });

  it("an unknown code degrades to generic copy rather than crashing or leaking the code", () => {
    const copy = denialCopy("something_new_from_the_backend");
    assert.ok(copy.title);
    assert.ok(!copy.title.includes("something_new"));
  });

  it("returns nothing when the student can act", () => {
    assert.equal(denialFor(test_({ state: "start", can_start: true })), null);
    assert.equal(denialFor(test_({ state: "review", can_start: false, can_review: true })), null);
  });

  it("only offers an upgrade path when the backend says one exists", () => {
    const upgradeable = denialFor(test_({ state: "locked", can_start: false, reason_code: "free_limit_reached", upgrade_available: true }));
    assert.equal(upgradeable.upgradeAvailable, true);

    const notUpgradeable = denialFor(test_({ state: "closed", can_start: false, reason_code: "exam_closed", upgrade_available: false }));
    assert.equal(notUpgradeable.upgradeAvailable, false);
    assert.equal(notUpgradeable.action, null, "a closed exam must not offer a purchase that would not help");
  });
});

describe("access source labelling", () => {
  it("names the source that is actually granting access", () => {
    assert.equal(sourceLabel(test_({ source: "subscription" })), "Included in your subscription");
    assert.equal(sourceLabel(test_({ source: "free_starter" })), "Using your free access");
    assert.equal(sourceLabel(test_({ source: "scholarship" })), "Included with your scholarship");
  });

  it("says nothing when the student cannot act", () => {
    assert.equal(sourceLabel(test_({ state: "locked", can_start: false, source: "none" })), null);
  });

  it("never leaks an internal id", () => {
    const label = sourceLabel(test_({ source: "direct_purchase" }));
    assert.ok(!/\d/.test(label));
  });
});

describe("free starter quota is read from the server, never computed locally", () => {
  const rows = [
    { resource_type: "mock_test", quantity: 1, used: 0, unlimited: false },
    { resource_type: "pyq", quantity: 50, used: 9, unlimited: false },
    { resource_type: "qbank", quantity: 0, used: 0, unlimited: true },
  ];

  it("reports remaining", () => {
    assert.deepEqual(quotaFor(rows, "pyq"), { unlimited: false, remaining: 41, used: 9, exhausted: false });
  });

  it("flags exhaustion", () => {
    const exhausted = quotaFor([{ resource_type: "mock_test", quantity: 1, used: 1 }], "mock_test");
    assert.equal(exhausted.remaining, 0);
    assert.equal(exhausted.exhausted, true);
  });

  it("handles unlimited", () => {
    assert.equal(quotaFor(rows, "qbank").unlimited, true);
  });

  it("never returns a negative remaining even if used exceeds quantity", () => {
    const odd = quotaFor([{ resource_type: "mock_test", quantity: 1, used: 5 }], "mock_test");
    assert.equal(odd.remaining, 0);
  });

  it("returns null for an unknown bucket or missing data", () => {
    assert.equal(quotaFor(rows, "grand_test"), null);
    assert.equal(quotaFor(null, "mock_test"), null);
  });
});

describe("cross-source: one exhausted source never presents as lost access", () => {
  it("free starter exhausted + subscription active still shows Start", () => {
    // The backend resolves the union; the UI must not second-guess it by
    // noticing the exhausted quota and drawing a lock.
    const t = test_({ state: "start", can_start: true, source: "subscription" });
    assert.equal(isLocked(t), false);
    assert.equal(cardPresentation(t).cta, "Start Test");
    assert.equal(denialFor(t), null);
    assert.equal(sourceLabel(t), "Included in your subscription");
  });
});
