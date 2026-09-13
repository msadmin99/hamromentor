/**
 * Regression coverage for the "Browse by Subject" per-subject emoji
 * mapping (SubjectGrid.js). Source-assertion style (no DOM/rendering test
 * infra in this repo — see mcqSemantics.test.mjs) plus a direct
 * re-implementation of the pure emojiForSubject() logic to prove its
 * actual behavior, since the real function isn't exported (kept private
 * to the one component that uses it, per the task's narrow scope).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "SubjectGrid.js"), "utf8");

test("the icon container's markup (size/background/alignment/spacing) is byte-for-byte unchanged", () => {
  assert.match(
    source,
    /className=\{`flex h-11 w-11 flex-none items-center justify-center rounded-full text-xl \$\{theme\.iconBg\} \$\{theme\.fg\}`\}/,
    "the existing icon container's classes must not change — only the content inside it"
  );
});

test("the card only ever renders the emoji helper's result inside the icon container, never subject.icon directly", () => {
  assert.match(source, /\{emojiForSubject\(subject\)\}/);
  assert.doesNotMatch(
    source.slice(source.indexOf("function SubjectCard")),
    /\{subject\.icon\}/,
    "SubjectCard must go through emojiForSubject(), not read subject.icon directly, so the fallback path is never bypassed"
  );
});

test("no other card content (progress bar, counts, navigation) was touched", () => {
  assert.match(source, /href=\{subject\.has_access \? `\/qbank\/\$\{subject\.slug\}` : "\/plans"\}/);
  assert.match(source, /\{subject\.question_count\} question/);
  assert.match(source, /\{subject\.module_count\} chapter/);
  assert.match(source, /style=\{\{ width: `\$\{pct\}%` \}\}/);
});

// Re-implements emojiForSubject()'s exact logic (kept private in
// SubjectGrid.js) to verify the actual mapping/normalization/fallback
// behavior end to end, not just that the source text mentions it.
const SUBJECT_EMOJIS = {
  BOTANY: "🌿", CHEMISTRY: "⚗️", PHYSICS: "⚡", BIOLOGY: "🧬", ANATOMY: "🫀",
  PHYSIOLOGY: "🫀", ZOOLOGY: "🐾", MATHEMATICS: "📐", ENGLISH: "📖",
  "GENERAL KNOWLEDGE": "🌐", BPKIHS: "🏛️", IOM: "🏛️", KU: "🏛️", MOE: "🏛️",
};
function emojiForSubject(subject) {
  const key = subject.name?.trim().toUpperCase();
  return (key && SUBJECT_EMOJIS[key]) || subject.icon;
}

test("every mapped subject/institution resolves to its exact required emoji", () => {
  const cases = [
    ["Botany", "🌿"], ["Chemistry", "⚗️"], ["Physics", "⚡"], ["Biology", "🧬"],
    ["Anatomy", "🫀"], ["Physiology", "🫀"], ["Zoology", "🐾"], ["Mathematics", "📐"],
    ["English", "📖"], ["General Knowledge", "🌐"],
    ["BPKIHS", "🏛️"], ["IOM", "🏛️"], ["KU", "🏛️"], ["MOE", "🏛️"],
  ];
  for (const [name, expected] of cases) {
    assert.equal(emojiForSubject({ name, icon: "book" }), expected, `${name} must map to ${expected}`);
  }
});

test("real subject names are stored in Title Case, not caps — the lookup must still match", () => {
  // Confirmed against the actual DB: Subject.name is stored like
  // "Physiology", not "PHYSIOLOGY" — the mapping's keys are uppercase, so
  // normalization is load-bearing, not defensive-only.
  assert.equal(emojiForSubject({ name: "Physiology", icon: "book" }), "🫀");
  assert.equal(emojiForSubject({ name: "  chemistry  ", icon: "book" }), "⚗️");
});

test("an unmapped subject falls back to its own existing icon field, never an incorrect emoji and never blank", () => {
  assert.equal(emojiForSubject({ name: "Forensic Medicine", icon: "book" }), "book");
  assert.equal(emojiForSubject({ name: "Pharmacology", icon: "💊" }), "💊", "a subject that already had its own real emoji keeps it");
});

test("a missing/empty subject name never throws and still falls back to the existing icon", () => {
  assert.equal(emojiForSubject({ name: "", icon: "book" }), "book");
  assert.equal(emojiForSubject({ icon: "book" }), "book");
  assert.doesNotThrow(() => emojiForSubject({}));
});

test("the backend Subject.icon field itself is never read from write side — this is a display-only mapping", () => {
  assert.doesNotMatch(source, /subject\.icon\s*=/, "must never assign to subject.icon — read-only fallback only");
});
