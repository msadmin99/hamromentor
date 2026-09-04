import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXPIRED,
  MILESTONES_SECONDS,
  announcementFor,
  timerLabel,
} from "./examTimerAnnounce.js";

/** Walk a countdown second by second the way the real timer does, collecting
 *  everything a screen reader would be told. This is the regression that
 *  matters: the defect being fixed was one announcement per second. */
function runCountdown(fromSeconds, toSeconds = 0) {
  const spoken = [];
  let last = null;
  for (let s = fromSeconds; s >= toSeconds; s -= 1) {
    const next = announcementFor(s, last);
    if (next) {
      last = next.milestone;
      spoken.push({ at: s, message: next.message });
    }
  }
  return spoken;
}

test("exam timer announcements", async (t) => {
  await t.test("a full countdown announces milestones, not seconds", () => {
    const spoken = runCountdown(1900, 0);
    // 30, 10, 5, 2, 1 minute, then expiry — six utterances for a 31-minute
    // exam, versus 1900 if the countdown itself were a live region.
    assert.equal(spoken.length, MILESTONES_SECONDS.length + 1);
    assert.ok(spoken.length < 10, "must not approach one announcement per second");
  });

  await t.test("the final five minutes announce three times, not three hundred", () => {
    const spoken = runCountdown(300, 0);
    assert.deepEqual(
      spoken.map((s) => s.message),
      ["5 minutes remaining.", "2 minutes remaining.", "1 minute remaining.", "Time is up. Your answers are being submitted."],
    );
  });

  await t.test("each milestone is announced exactly once", () => {
    const spoken = runCountdown(1900, 0);
    const milestones = spoken.map((s) => s.message);
    assert.equal(new Set(milestones).size, milestones.length);
  });

  await t.test("milestones fire at the second they are crossed", () => {
    for (const m of MILESTONES_SECONDS) {
      const next = announcementFor(m, null);
      assert.equal(next.milestone, m, `expected the ${m}s milestone to fire at exactly ${m}s`);
    }
  });

  await t.test("nothing is said before the first milestone", () => {
    assert.equal(announcementFor(3600, null), null);
    assert.equal(announcementFor(1801, null), null);
  });

  await t.test("joining late announces only the current milestone, not a backlog", () => {
    // A student opening the tab with 4 minutes left must hear "5 minutes",
    // not a burst of 30/10/5 all at once.
    const next = announcementFor(240, null);
    assert.equal(next.message, "5 minutes remaining.");
    assert.equal(announcementFor(240, next.milestone), null);
  });

  await t.test("time jumping backwards does not re-announce a passed milestone", () => {
    // The tab wakes and re-syncs against the server deadline, which can
    // move `remaining` up slightly. That must not replay an announcement.
    const afterOneMinute = announcementFor(60, 120).milestone;
    assert.equal(afterOneMinute, 60);
    assert.equal(announcementFor(75, afterOneMinute), null);
    assert.equal(announcementFor(119, afterOneMinute), null);
  });

  await t.test("expiry is announced once and never repeats", () => {
    const first = announcementFor(0, 60);
    assert.equal(first.milestone, EXPIRED);
    assert.match(first.message, /Time is up/);
    assert.equal(announcementFor(0, EXPIRED), null);
    assert.equal(announcementFor(-30, EXPIRED), null);
  });

  await t.test("a null remaining says nothing", () => {
    assert.equal(announcementFor(null, null), null);
    assert.equal(announcementFor(undefined, null), null);
  });

  await t.test("singular minute is not pluralised", () => {
    assert.equal(announcementFor(60, 120).message, "1 minute remaining.");
  });

  await t.test("the announcement never leaks exam content", () => {
    // A live region in the test player must carry time only — never a
    // question, an option, or an answer.
    for (const s of runCountdown(1900, 0)) {
      assert.match(s.message, /remaining|Time is up/);
    }
  });
});

test("timer accessible name", async (t) => {
  await t.test("reads the clock in words", () => {
    assert.equal(timerLabel(3661), "Time remaining: 1 hour 1 minute");
    assert.equal(timerLabel(1500), "Time remaining: 25 minutes");
  });

  await t.test("includes seconds only in the final minute", () => {
    assert.ok(timerLabel(45).includes("45 seconds"));
    assert.ok(!timerLabel(1500).includes("second"));
  });

  await t.test("handles the unknown and expired cases without throwing", () => {
    assert.match(timerLabel(null), /not available/);
    assert.match(timerLabel(0), /Time is up/);
    assert.match(timerLabel(-5), /Time is up/);
  });

  await t.test("is a name, not a live region — it never announces on its own", () => {
    // Pinned as documentation of the contract: this string is only read
    // when the user queries the control. Two different seconds produce two
    // different names, which is exactly why it must not be a live region.
    assert.notEqual(timerLabel(120), timerLabel(119));
  });
});
