/**
 * Content-rendering fix (2026-09-28) — end-to-end proof using the EXACT
 * same sequence RichContent.js itself runs: renderRichHtml (text-
 * formatting, then math/chemistry) followed by real DOMPurify
 * sanitization. Unlike richContentMath.test.mjs (which re-implements its
 * own render pipeline to isolate mathDelimiters.js's pure logic), this
 * file goes through richHtml.js directly — the same module RichContent.js
 * itself imports — so it also exercises the mhchem side-effect import at
 * the top of that file exactly as production does.
 *
 * jsdom + dompurify let this run under plain `node --test` without a
 * browser; RichContent.js itself can't be imported directly here (it also
 * pulls in React/JSX), so this proves the pipeline it calls, not the
 * component wrapper.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

import { renderRichHtml } from "../lib/richHtml.js";

const purify = createDOMPurify(new JSDOM("").window);

// Mirrors RichContent.js's own sanitizeRichHtml exactly.
function sanitizeRichHtml(html) {
  if (!html) return "";
  return purify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_ATTR: ["style", "target"],
  });
}

function render(html) {
  return sanitizeRichHtml(renderRichHtml(html));
}

test("production bug: raw \\textbf{}/\\textit{} no longer reach the student as literal text", async (t) => {
  await t.test("the exact production explanation from the bug report", () => {
    const input =
      "<p>\\textbf{Correct Answer:} D) Chimpanzee \\textbf{Core Concept:} Molecular phylogenetics " +
      "demonstrates that chimpanzees (\\textit{Pan troglodytes} and \\textit{Pan paniscus}) are the " +
      "closest living evolutionary relatives of modern humans. \\textbf{Detailed Explanation:} DNA " +
      "sequence alignment demonstrates ~ 98.8\\% genomic identity. \\textbf{Option Analysis:} Gorilla " +
      "(A) is the second closest living relative. \\textbf{Review Point:} Chimpanzee shares ~ 98.8\\% " +
      "DNA homology with humans.</p>";
    const out = render(input);
    assert.doesNotMatch(out, /\\textbf|\\textit/, "no raw LaTeX text-formatting command should ever reach the DOM");
    assert.match(out, /<strong>Correct Answer:<\/strong>/);
    assert.match(out, /<strong>Core Concept:<\/strong>/);
    assert.match(out, /<strong>Detailed Explanation:<\/strong>/);
    assert.match(out, /<strong>Option Analysis:<\/strong>/);
    assert.match(out, /<strong>Review Point:<\/strong>/);
    assert.match(out, /<em>Pan troglodytes<\/em>/);
    assert.match(out, /<em>Pan paniscus<\/em>/);
  });
});

test("production bug: chemical formulas render with chemistry typography, not math italics", async (t) => {
  const formulas = ["H_2SO_4", "HNO_3", "NO_2^+", "KMnO_4", "H_2O", "CO_2", "NH_3", "CaCO_3", "NaHCO_3", "CH_3COOH"];
  for (const formula of formulas) {
    await t.test(formula, () => {
      const out = render(`<p>In the reaction, concentrated \\(${formula}\\) is used.</p>`);
      assert.match(out, /class="katex"/, "must render through KaTeX");
      // mhchem renders element symbols upright (mathvariant="normal") —
      // adjacent non-subscripted letters can be coalesced into one <mi>
      // text run (e.g. "KMnO" as a single node) rather than one per
      // element, so this checks for the property (at least one upright
      // run of letters present) rather than one exact node per symbol.
      assert.match(out, /mathvariant="normal">[A-Za-z]+</, `${formula} must render at least one upright element run`);
      assert.match(out, /\\ce\{/, `${formula} must have been rewritten through mhchem`);
    });
  }
});

test("genuine mathematics is never treated as chemistry and keeps rendering correctly", async (t) => {
  const cases = [
    String.raw`\(x^2\)`,
    String.raw`\(10^{-3}\)`,
    String.raw`\(K_a\)`,
    String.raw`\(\Delta H\)`,
    String.raw`\(E_k = \frac{3}{2}k_BT\)`,
    String.raw`\(\frac{a}{b}\)`,
    String.raw`\(\sqrt{x}\)`,
    String.raw`\(\sum_{i=1}^n i\)`,
    String.raw`\(\int_0^1 x\,dx\)`,
  ];
  for (const expr of cases) {
    await t.test(expr, () => {
      const out = render(`<p>Given ${expr} here.</p>`);
      assert.match(out, /class="katex"/, "must still render through KaTeX");
      // None of these were ever wrapped for mhchem (isLegacyChemicalFormula
      // rejects all of them — see chemistryDetection.test.mjs) — this is
      // the annotation-level proof that the chemistry rewrite never fired.
      assert.doesNotMatch(out, /\\ce\{/, `${expr} must not have been rewritten through mhchem`);
    });
  }

  await t.test("K_a and E_k specifically must NOT render upright (they are math variables, not chemistry)", () => {
    const out = render(String.raw`<p>The value of \(K_a\) and \(E_k\) matter here.</p>`);
    assert.doesNotMatch(out, /mathvariant="normal">K</);
    assert.doesNotMatch(out, /mathvariant="normal">E</);
  });
});

test("mixed content: prose formatting + chemistry + genuine mathematics in one explanation", async (t) => {
  await t.test("Phase 6 case 1", () => {
    const input =
      "<p>\\textbf{Correct Answer:} D. The reaction uses \\(H_2SO_4\\) as an acid catalyst. " +
      "The kinetic energy is \\(E_k = \\frac{3}{2}k_BT\\).</p>";
    const out = render(input);
    assert.match(out, /<strong>Correct Answer:<\/strong>/, "bold heading");
    assert.match(out, /mathvariant="normal">H</, "chemistry correctly formatted");
    assert.doesNotMatch(out, /mathvariant="normal">E</, "genuine math (E_k) correctly stays math-italic");
    assert.match(out, /class="katex"/);
    assert.doesNotMatch(out, /\\textbf|\\textit/, "no raw command leakage");
  });

  await t.test("Phase 6 case 2", () => {
    const input = "<p>\\textbf{Core Concept:} The concentration of \\(H_2SO_4\\) is important.</p>";
    const out = render(input);
    assert.match(out, /<strong>Core Concept:<\/strong>/);
    assert.match(out, /mathvariant="normal">H</);
  });
});

test("security: malicious \\textbf{}/\\textit{} payloads never execute", async (t) => {
  await t.test("<script> tag is stripped entirely", () => {
    const out = render(String.raw`\textbf{<script>alert(document.cookie)</script>}`);
    assert.doesNotMatch(out, /<script/i);
    assert.doesNotMatch(out, /alert\(/);
  });

  await t.test("onerror handler is stripped, tag itself may remain", () => {
    const out = render(String.raw`\textit{<img src=x onerror=alert(1)>}`);
    assert.doesNotMatch(out, /onerror/i);
  });

  await t.test("javascript: URL is stripped from an anchor", () => {
    const out = render(String.raw`\textbf{<a href="javascript:alert(1)">click</a>}`);
    assert.doesNotMatch(out, /javascript:/i);
  });

  await t.test("an SVG-based XSS payload is neutralised", () => {
    const out = render(String.raw`\textit{<svg onload=alert(1)></svg>}`);
    assert.doesNotMatch(out, /onload/i);
  });
});

test("existing plain HTML content (no LaTeX at all) is completely unaffected", () => {
  const input = "<p>This is a completely ordinary explanation with <strong>existing bold</strong> and no LaTeX.</p>";
  assert.equal(render(input), input);
});
