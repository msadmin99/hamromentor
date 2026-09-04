/**
 * MCQ / exam-control accessibility — permanent regression guard.
 *
 * This repository has no DOM or component-rendering test infrastructure
 * (tests run under `node --test`, with no jsdom, React Testing Library or
 * browser automation — see docs/ACCESSIBILITY_AUDIT.md §6 for why none was
 * added). These tests therefore assert the *source* of the exam answer
 * control rather than rendered output.
 *
 * That is a real limitation and is stated plainly: a source assertion
 * proves the correct markup is written, not that a browser or screen
 * reader announces it. What it does reliably catch is the regression this
 * task exists to prevent — the control silently going back to
 * `aria-pressed`, losing its group, or losing its checked state — which is
 * exactly how the defect got in and stayed in.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = readFileSync(join(here, "QuestionWorkspace.js"), "utf8");
const resultBar = readFileSync(join(here, "..", "OptionResultBar.js"), "utf8");

/** The answer-options block only — so assertions about the options cannot
 *  be accidentally satisfied by the Bookmark / Mark-for-Review buttons,
 *  which are genuine toggles and legitimately keep aria-pressed. */
function optionsBlock() {
  // Matches the real JSX element, not the word "<fieldset>" as it appears
  // in the explanatory comment above it.
  const start = workspace.indexOf("<fieldset className=");
  const end = workspace.indexOf("</fieldset>");
  assert.ok(start > -1 && end > start, "the answer options must be wrapped in a <fieldset>");
  return workspace.slice(start, end);
}

test("single-choice MCQ semantics", async (t) => {
  await t.test("options are a grouped set, not loose controls", () => {
    const block = optionsBlock();
    assert.match(block, /<legend/, "the group needs an accessible name");
  });

  await t.test("the group's accessible name identifies the question", () => {
    assert.match(optionsBlock(), /Answer options for question \{questionNumber\}/);
  });

  await t.test("REGRESSION: answer options must never use aria-pressed", () => {
    // The defect this task fixes. aria-pressed announces "pressed / not
    // pressed" — an independent toggle — which is wrong for picking one
    // answer out of four: no group, no position, no mutual exclusivity.
    assert.doesNotMatch(
      optionsBlock(),
      /aria-pressed/,
      "answer options regressed to aria-pressed; single-choice answers must use radio semantics",
    );
  });

  await t.test("options are native radio inputs", () => {
    assert.match(optionsBlock(), /type="radio"/);
  });

  await t.test("selected state is exposed semantically, not only visually", () => {
    // `checked` is what conveys selection to assistive technology. The
    // border/ring classes are the visual half of the same fact.
    assert.match(optionsBlock(), /checked=\{selected\}/);
  });

  await t.test("each option has a label bound to its own input", () => {
    const block = optionsBlock();
    assert.match(block, /id=\{inputId\}/);
    assert.match(block, /htmlFor=\{inputId\}/);
    assert.match(block, /const inputId = `q\$\{question\.id\}-opt\$\{opt\.id\}`/);
  });

  await t.test("mutual exclusivity is per question, not per page", () => {
    // questions_per_page > 1 stacks several questions on one page. A shared
    // radio name would make them one group, so answering question 2 would
    // clear question 1 — a data-loss bug, not just an a11y one.
    assert.match(optionsBlock(), /name=\{`question-\$\{question\.id\}`\}/);
  });

  await t.test("the radio stays focusable rather than being hidden", () => {
    // sr-only, not `hidden` or display:none — a hidden input is not
    // focusable and arrow-key selection would stop working.
    const block = optionsBlock();
    assert.match(block, /className="peer sr-only"/);
    assert.doesNotMatch(block, /type="radio"[^>]*hidden/);
  });

  await t.test("keyboard focus is visible even though the input is not", () => {
    assert.match(optionsBlock(), /peer-focus-visible:outline/);
  });

  await t.test("selection still goes through the existing persistence callback", () => {
    // Persistence must be untouched: same onSelectOption, so the same
    // single POST per change, with the same server-side update_or_create.
    assert.match(optionsBlock(), /onChange=\{\(\) => onSelectOption\(opt\.id\)\}/);
    assert.doesNotMatch(optionsBlock(), /onKeyDown|onKeyUp|onKeyPress/,
      "no hand-rolled key handling — native radios already provide arrow-key selection");
  });

  await t.test("no ARIA is hand-rolled over the native control", () => {
    const block = optionsBlock();
    for (const attr of ['role="radio"', 'role="radiogroup"', "aria-checked", "tabIndex"]) {
      assert.ok(!block.includes(attr), `${attr} duplicates what the native radio already provides`);
    }
  });
});

test("toggles that are genuinely toggles keep aria-pressed", async (t) => {
  await t.test("bookmark and mark-for-review are independent, not exclusive", () => {
    // Guards the opposite mistake: a blanket sweep replacing every
    // aria-pressed would break these, which really are on/off toggles.
    assert.match(workspace, /aria-pressed=\{bookmarked\}/);
    assert.match(workspace, /aria-pressed=\{marked\}/);
  });

  await t.test("mark-for-review state is not conveyed by colour alone", () => {
    assert.match(workspace, /marked \? "Review" : "Mark"/);
  });
});

test("QBank practice keeps button semantics — a different interaction, not an oversight", async (t) => {
  const solver = readFileSync(join(here, "..", "QuestionSolver.js"), "utf8");

  await t.test("REGRESSION: QBank options must NOT become radios", () => {
    // The exam player and QBank differ in interaction model, not question
    // type. In the exam an answer is a revisable selection until submit,
    // so it is a radio. In QBank, clicking an option immediately posts it
    // and reveals the result — `selectOption` opens with `if (result)
    // return;`, making it one-shot and irreversible. That is an action,
    // and a radio would actively mislead by implying the choice can still
    // be changed. A blanket "replace every option control with a radio"
    // sweep would break this; this test stops it.
    assert.match(solver, /if \(result\) return;/, "QBank answering must stay one-shot");
    assert.doesNotMatch(solver, /type="radio"/);
  });

  await t.test("the commit control is a real button", () => {
    assert.match(solver, /<button\n\s+key=\{opt\.id\}\n\s+onClick=\{\(\) => selectOption\(opt\)\}/);
  });
});

test("review mode does not signal correctness by colour or glyph alone", async (t) => {
  await t.test("correctness is stated in text for assistive technology", () => {
    assert.match(resultBar, /Correct answer\./);
    assert.match(resultBar, /Incorrect\./);
  });

  await t.test("the decorative tick/cross is hidden from assistive technology", () => {
    assert.match(resultBar, /<span aria-hidden="true">\{state === "correct" \? "✓ "/);
  });

  await t.test("SOLUTION LOCK: correctness text is gated behind showIcon", () => {
    // showIcon is only true for state "correct"/"wrong-selected". When
    // solutions are locked the result page passes only "selected" or
    // "neutral", so neither string can render — and the payload omits
    // is_correct entirely anyway. This pins that the accessible text did
    // not become a second, ungated channel for the answer key.
    const showIcon = /const showIcon = state === "correct" \|\| state === "wrong-selected"/;
    assert.match(resultBar, showIcon);
    const srBlock = resultBar.slice(resultBar.indexOf("{showIcon && ("), resultBar.indexOf("</span>", resultBar.indexOf("{showIcon && (")));
    assert.match(srBlock, /Correct answer\./);
  });

  await t.test("the percentage stays available rather than being hidden with the glyph", () => {
    assert.match(resultBar, /% of students chose this option\./);
  });
});
