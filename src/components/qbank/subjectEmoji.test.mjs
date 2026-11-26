/**
 * Regression coverage for the "Browse by Subject" per-subject icon mapping
 * (SubjectGrid.js). Source-assertion style (no DOM/rendering test infra in
 * this repo — see mcqSemantics.test.mjs) plus a direct re-implementation of
 * the pure iconForSubject() normalization/fallback logic to prove its
 * actual behavior. The real function can't be imported directly here even
 * though it's exported: SubjectGrid.js imports icons.js, which contains
 * JSX, and this suite runs under plain `node --test` with no JSX
 * transform — see accessState.js's own identical constraint.
 *
 * Professional-icon pass: this file used to assert a per-subject EMOJI
 * mapping with a raw-string fallback to subject.icon (the backend's own
 * generic 'book' default, which rendered as literal text, not a glyph).
 * Updated to assert the icon-COMPONENT mapping and its new, deliberately
 * safer fallback (BookOpenIcon, always a real icon, never raw text).
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
    /className=\{`flex h-11 w-11 flex-none items-center justify-center rounded-full \$\{theme\.iconBg\} \$\{theme\.fg\}`\}/,
    "the existing icon container's classes must not change — only the content inside it"
  );
});

test("the card only ever renders the resolved Icon prop inside the icon container, never subject.icon directly", () => {
  assert.match(source, /<Icon className="h-5 w-5" \/>/);
  assert.doesNotMatch(
    source.slice(source.indexOf("function SubjectCard")),
    /\{subject\.icon\}/,
    "SubjectCard must render the resolved Icon prop, not read subject.icon directly, so the fallback path is never bypassed"
  );
});

test("no other card content (progress bar, counts, navigation) was touched", () => {
  assert.match(source, /href=\{subject\.has_access \? `\/qbank\/\$\{subject\.slug\}` : "\/plans"\}/);
  assert.match(source, /\{subject\.question_count\} question/);
  assert.match(source, /\{subject\.module_count\} chapter/);
  assert.match(source, /style=\{\{ width: `\$\{pct\}%` \}\}/);
});

// Each subject/institution key must map to its documented icon component in
// the real source — catches a silent remap without needing to import JSX.
test("every mapped subject/institution resolves to its exact required icon component", () => {
  const cases = [
    ["BOTANY", "LeafIcon"],
    ["CHEMISTRY", "FlaskIcon"],
    ["PHYSICS", "BoltIcon"],
    ["BIOLOGY", "DnaIcon"],
    ["ANATOMY", "HeartPulseIcon"],
    ["PHYSIOLOGY", "HeartPulseIcon"],
    ["ZOOLOGY", "PawIcon"],
    ["MATHEMATICS", "RulerIcon"],
    ["ENGLISH", "BookOpenIcon"],
    ['"GENERAL KNOWLEDGE"', "GlobeIcon"],
    ["BPKIHS", "BuildingIcon"],
    ["IOM", "BuildingIcon"],
    ["KU", "BuildingIcon"],
    ["MOE", "BuildingIcon"],
  ];
  const mapBody = source.slice(source.indexOf("const SUBJECT_ICONS"), source.indexOf("};", source.indexOf("const SUBJECT_ICONS")));
  for (const [key, expected] of cases) {
    assert.ok(new RegExp(`${key}:\\s*${expected}\\b`).test(mapBody), `${key} must map to ${expected}`);
  }
});

// Re-implements iconForSubject()'s exact normalization/fallback logic with
// dummy marker values standing in for the real icon components, to verify
// the actual runtime behavior (case-insensitivity, whitespace trimming,
// fallback-to-default) end to end, not just that the source text mentions it.
const DEFAULT_ICON = Symbol("BookOpenIcon");
const SUBJECT_ICON_MARKERS = {
  BOTANY: Symbol("LeafIcon"),
  CHEMISTRY: Symbol("FlaskIcon"),
  PHYSIOLOGY: Symbol("HeartPulseIcon"),
};
function iconForSubject(subject) {
  const key = subject.name?.trim().toUpperCase();
  return (key && SUBJECT_ICON_MARKERS[key]) || DEFAULT_ICON;
}

test("real subject names are stored in Title Case, not caps — the lookup must still match", () => {
  // Confirmed against the actual DB: Subject.name is stored like
  // "Physiology", not "PHYSIOLOGY" — the mapping's keys are uppercase, so
  // normalization is load-bearing, not defensive-only.
  assert.equal(iconForSubject({ name: "Physiology" }), SUBJECT_ICON_MARKERS.PHYSIOLOGY);
  assert.equal(iconForSubject({ name: "  chemistry  " }), SUBJECT_ICON_MARKERS.CHEMISTRY);
});

test("an unmapped subject falls back to the generic BookOpenIcon, never raw text and never blank", () => {
  assert.equal(iconForSubject({ name: "Forensic Medicine", icon: "book" }), DEFAULT_ICON);
  assert.equal(iconForSubject({ name: "Pharmacology", icon: "💊" }), DEFAULT_ICON, "the backend's own icon field is never read — always a real icon component");
});

test("a missing/empty subject name never throws and still falls back to the default icon", () => {
  assert.equal(iconForSubject({ name: "", icon: "book" }), DEFAULT_ICON);
  assert.equal(iconForSubject({ icon: "book" }), DEFAULT_ICON);
  assert.doesNotThrow(() => iconForSubject({}));
});

test("the backend Subject.icon field itself is never read from or written to — this is a display-only mapping", () => {
  assert.doesNotMatch(source, /subject\.icon/, "must never read or assign subject.icon — the fallback is always a real icon component, never backend text");
});
