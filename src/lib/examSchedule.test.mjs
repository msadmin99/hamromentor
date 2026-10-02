import assert from "node:assert/strict";
import { test } from "node:test";
import { formatScheduleDate, formatScheduleDateTime, formatScheduleDay, formatScheduleParts, resolveExamSchedule } from "./examSchedule.js";

test("resolveExamSchedule", async (t) => {
  await t.test("prefers grand_test_schedule (session-resolved) over the raw scheduled_start/end", () => {
    const test_ = {
      scheduled_start: "2026-09-01T00:00:00+00:00",
      scheduled_end: "2026-09-01T02:00:00+00:00",
      grand_test_schedule: { start: "2026-10-03T13:15:00+00:00", end: "2026-10-03T16:15:00+00:00" },
    };
    assert.deepEqual(resolveExamSchedule(test_), { start: "2026-10-03T13:15:00+00:00", end: "2026-10-03T16:15:00+00:00" });
  });

  await t.test("falls back to scheduled_start/end when grand_test_schedule is null (unscheduled-via-session Grand Test, or Daily Test)", () => {
    const test_ = { scheduled_start: "2026-09-01T00:00:00+00:00", scheduled_end: "2026-09-01T02:00:00+00:00", grand_test_schedule: null };
    assert.deepEqual(resolveExamSchedule(test_), { start: "2026-09-01T00:00:00+00:00", end: "2026-09-01T02:00:00+00:00" });
  });

  await t.test("returns null when there is no schedule at all — never invents one", () => {
    assert.equal(resolveExamSchedule({ scheduled_start: null, grand_test_schedule: null }), null);
    assert.equal(resolveExamSchedule(null), null);
  });

  await t.test("a grand_test_schedule with a start but no end still returns it (end may legitimately be null)", () => {
    const test_ = { grand_test_schedule: { start: "2026-10-03T13:15:00+00:00", end: null } };
    assert.deepEqual(resolveExamSchedule(test_), { start: "2026-10-03T13:15:00+00:00", end: null });
  });
});

test("formatScheduleParts — explicit Asia/Kathmandu rendering", async (t) => {
  await t.test("renders the exact Kathmandu wall-clock date/weekday/time for a UTC-offset ISO value", () => {
    // 2026-10-03T13:15:00+00:00 is 2026-10-03T19:00:00+05:45 in Kathmandu.
    const parts = formatScheduleParts("2026-10-03T13:15:00+00:00");
    assert.equal(parts.isoDate, "2026-10-03");
    assert.equal(parts.weekday, "Saturday");
    assert.equal(parts.time, "7:00 PM");
  });

  await t.test("correctly crosses a calendar day boundary in Kathmandu that UTC alone would not show", () => {
    // 2026-10-03T19:00:00+00:00 is 2026-10-04T00:45:00+05:45 in Kathmandu —
    // the exact mechanism behind the reported "12:45 AM" bug when a naive
    // datetime-local value is stored as UTC instead of Kathmandu local.
    const parts = formatScheduleParts("2026-10-03T19:00:00+00:00");
    assert.equal(parts.isoDate, "2026-10-04");
    assert.equal(parts.time, "12:45 AM");
  });

  await t.test("returns null for a missing or invalid value", () => {
    assert.equal(formatScheduleParts(null), null);
    assert.equal(formatScheduleParts(""), null);
    assert.equal(formatScheduleParts("not-a-date"), null);
  });
});

test("formatScheduleDay", async (t) => {
  await t.test("returns the Kathmandu-local day number and short month", () => {
    const { day, month } = formatScheduleDay("2026-10-03T19:00:00+00:00"); // -> Oct 4 in Kathmandu
    assert.equal(day, 4);
    assert.equal(month, "Oct");
  });

  await t.test("returns a placeholder for a missing value", () => {
    assert.deepEqual(formatScheduleDay(null), { day: "--", month: "" });
  });
});

test("formatScheduleDateTime / formatScheduleDate", async (t) => {
  await t.test("formatScheduleDateTime includes weekday, date, year, and time, all Kathmandu-local", () => {
    const formatted = formatScheduleDateTime("2026-10-03T13:15:00+00:00");
    assert.match(formatted, /Sat/);
    assert.match(formatted, /Oct 3, 2026/);
    assert.match(formatted, /7:00 PM/);
  });

  await t.test("formatScheduleDate omits weekday/time", () => {
    const formatted = formatScheduleDate("2026-10-03T13:15:00+00:00");
    assert.equal(formatted, "Oct 3, 2026");
  });

  await t.test("both return null for a missing value", () => {
    assert.equal(formatScheduleDateTime(null), null);
    assert.equal(formatScheduleDate(null), null);
  });
});
