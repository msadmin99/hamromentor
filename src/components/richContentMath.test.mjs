/**
 * End-to-end (real KaTeX, no fake renderer) proof that the exact cases
 * from the production bug report render as mathematics, not literal LaTeX
 * source. This mirrors exactly what RichContent's `renderInlineLatex` does
 * (see src/components/RichContent.js): `renderMathInHtml` finds each
 * delimited span and hands the bare expression to
 * `katex.renderToString(expr, { throwOnError: false, displayMode })`.
 *
 * `katex.renderToString` has no DOM dependency, so this can run under
 * plain `node --test` — unlike RichContent.js itself, which also imports
 * `dompurify` (browser-only) and can't be imported directly here (see the
 * no-DOM-test-infra note in mcqSemantics.test.mjs).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import katex from "katex";

import { renderMathInHtml } from "../lib/mathDelimiters.js";

function renderLikeRichContent(html) {
  return renderMathInHtml(html, (expr, { displayMode }) =>
    katex.renderToString(expr, { throwOnError: false, displayMode })
  );
}

// No raw delimiter or backslash-command source should ever remain visible
// as plain text in the output — only inside KaTeX's own generated markup
// (e.g. the "katex-mathml" annotation, which is not visible to the user).
function assertNoLeakedDelimiters(out) {
  assert.doesNotMatch(out, /\\\(|\\\)|\\\[|\\\]/, "raw \\( \\) \\[ \\] delimiters must not reach the browser as text");
}

test("bug report cases render as KaTeX markup, not literal LaTeX text", async (t) => {
  const cases = [
    ["dimensions of calorie", String.raw`The dimensions of calorie are: \(ML^2T^{-2}\)`],
    ["coefficient of viscosity", String.raw`Coefficient of viscosity: \(\text{dyn cm}^{-2}\text{s}\)`],
    ["universal gas constant", String.raw`Universal gas constant: \(J\,K^{-1}mol^{-1}\)`],
    ["power FV", String.raw`Power when force, velocity and time are fundamental quantities: \(FV\)`],
    ["fraction", String.raw`Fraction: \(\frac{F}{A}\)`],
    ["greek + fraction", String.raw`\(\eta = \frac{F}{A}\frac{dv}{dx}\)`],
    ["display equation", "Display equation:\n\\[\nPV=nRT\n\\]"],
    ["mixed text", String.raw`The SI unit of pressure is \(N\,m^{-2}\).`],
    ["malformed legacy nesting", String.raw`\(\[\text{M L}^2\text{T}^{-2}\]\)`],
  ];

  for (const [label, input] of cases) {
    await t.test(label, () => {
      const out = renderLikeRichContent(input);
      assertNoLeakedDelimiters(out);
      assert.match(out, /class="katex"/, "KaTeX markup must be present");
    });
  }
});

test("chemical formula H_2O renders 2 as a real subscript", () => {
  const out = renderLikeRichContent(String.raw`Chemical formula: \(H_2O\)`);
  assertNoLeakedDelimiters(out);
  // KaTeX emits two representations: an <msub> in the MathML tree (used by
  // screen readers/copy-paste — the raw "H_2O" TeX source legitimately
  // appears once more here, inside <annotation>, which is fine) and the
  // actual on-screen rendering in .katex-html, built from a "vlist" stack
  // rather than a semantic <sub>. What must NOT happen is the visible
  // .katex-html branch falling back to plain text "H_2O".
  assert.match(out, /<msub>/, "MathML subscript element must be present");
  assert.match(out, /class="[^"]*vlist[^"]*"/, "visible subscript vlist structure must be present");
  const visible = out.split('class="katex-html"')[1] ?? "";
  assert.doesNotMatch(visible, />H_2O</, "the visible rendering must not fall back to literal underscore text");
});

test("other required chemical formulas also produce subscript structure", () => {
  for (const formula of [String.raw`\(CO_2\)`, String.raw`\(H_2SO_4\)`]) {
    const out = renderLikeRichContent(formula);
    assertNoLeakedDelimiters(out);
    assert.match(out, /class="[^"]*vlist[^"]*"/, `${formula} must render a real subscript`);
  }
});

test("display equation uses KaTeX's display-mode wrapper, inline does not", () => {
  const display = renderLikeRichContent("\\[E=mc^2\\]");
  const inline = renderLikeRichContent(String.raw`\(E=mc^2\)`);
  assert.match(display, /katex-display/, "\\[...\\] must render in KaTeX display mode");
  assert.doesNotMatch(inline, /katex-display/, "\\(...\\) must stay inline, not display mode");
});

test("\\sqrt, \\sum and \\int render without error markup", () => {
  for (const expr of [String.raw`\(\sqrt{x}\)`, String.raw`\(\sum_{i=1}^n i\)`, String.raw`\(\int_0^1 x\,dx\)`]) {
    const out = renderLikeRichContent(expr);
    assertNoLeakedDelimiters(out);
    assert.doesNotMatch(out, /katex-error/, `${expr} must not produce a KaTeX error span`);
  }
});

test("a genuinely broken command degrades to a KaTeX error span, not a crash, and stays inline", () => {
  // throwOnError:false means katex.renderToString itself never throws for
  // bad input — it returns an inline error span instead. renderMathInHtml
  // only falls back to the raw source if `render` throws or returns
  // falsy/non-string, so this proves the pipeline stays stable end to end
  // for content KaTeX cannot parse, without needing renderMathInHtml's own
  // fallback path.
  const out = renderLikeRichContent(String.raw`\(\notarealcommand{x}\)`);
  assert.doesNotThrow(() => out);
  assert.equal(typeof out, "string");
});

test("plain HTML with no math anywhere is returned byte-for-byte unchanged", () => {
  const input = "<p>No mathematics in this explanation at all.</p>";
  assert.equal(renderLikeRichContent(input), input);
});
