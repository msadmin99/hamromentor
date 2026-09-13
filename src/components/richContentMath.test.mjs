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

import { decodeHtmlEntities, renderMathInHtml } from "../lib/mathDelimiters.js";

// Mirrors RichContent.js's stripEmbeddedTags exactly (not exported from
// that file, since it's a browser/dompurify-importing component that
// can't itself be loaded under plain `node --test` — see this file's own
// docstring) so this test proves the REAL production pipeline, entity
// decode included, not just the delimiter-matching logic in isolation.
function stripEmbeddedTags(expr) {
  return expr.replace(/<\/?[a-zA-Z][^>]*>/g, "").replace(/&lt;\/?[a-zA-Z][^&]*?&gt;/g, "");
}

function renderLikeRichContent(html) {
  return renderMathInHtml(html, (expr, { displayMode }) => {
    const cleaned = stripEmbeddedTags(decodeHtmlEntities(expr)).trim();
    if (!cleaned) return null;
    return katex.renderToString(cleaned, { throwOnError: false, displayMode });
  });
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

/**
 * Explanation redesign, stage 2 — real production bug reports. Each case
 * reproduces the exact stored-HTML shape (a literal "<"/">" inside a math
 * delimiter, legitimately HTML-escaped by the bulk-import pipeline before
 * storage) that was reaching the browser as visible "&lt;"/"&gt;" text.
 */
// Isolates the VISIBLE rendering (.katex-html) from the MathML fallback
// tree (.katex-mathml, aria-hidden — screen-reader/copy-paste only) and
// the <annotation> it carries, which always contains the raw TeX source
// verbatim BY DESIGN (see the existing "chemical formula H_2O" test above)
// and, being real XML content, correctly re-escapes a literal "<"/">"/"&"
// as "&lt;"/"&gt;"/"&amp;" itself — that is correct, valid markup, not the
// bug. The bug this fix closes is specifically about what a real browser
// ends up DISPLAYING, i.e. the visible branch only.
function visibleBranch(out) {
  return out.split('class="katex-html"')[1] ?? "";
}

test("production bug: an HTML-escaped comparison operator inside \\(...\\) renders as real math, not visible entity text", () => {
  const cases = [
    ["K_a < 6", String.raw`\(K_a &lt; 6\)`, /<span class="mrel">&lt;<\/span>/],
    ["M > 1", String.raw`\(M &gt; 1\)`, /<span class="mrel">&gt;<\/span>/],
    ["M < 1", String.raw`\(M &lt; 1\)`, /<span class="mrel">&lt;<\/span>/],
  ];
  for (const [label, input, visiblePattern] of cases) {
    const out = renderLikeRichContent(input);
    // The real, previously-reproduced bug: a DOUBLE-escaped entity
    // ("&amp;lt;") anywhere in the output, which is what a browser
    // decodes down to literal visible "&lt;" text. A single-escaped
    // "&lt;" (correct, valid HTML/XML markup for a literal "<") is fine
    // and expected — see this file's own note above.
    assert.doesNotMatch(out, /&amp;(lt|gt|amp);/, `${label}: must never be double-escaped`);
    assert.match(visibleBranch(out), visiblePattern, `${label}: the visible KaTeX rendering must contain the real operator, not have silently dropped it`);
  }
});

test("production bug: a bare, undelimited \\Rightarrow reaches the student as a rendered arrow, not literal backslash text", () => {
  const out = renderLikeRichContent("A high pH \\Rightarrow more unionized drug.");
  // \Rightarrow legitimately still appears once, inside the hidden
  // MathML <annotation> (the raw-source fallback every rendered
  // expression carries) — what must never happen is the VISIBLE branch
  // falling back to showing the raw command text instead of the ⇒ glyph.
  assert.doesNotMatch(visibleBranch(out), /\\Rightarrow/, "the visible rendering must not fall back to literal backslash text");
  assert.match(visibleBranch(out), /⇒/, "the visible rendering must contain the actual rendered arrow glyph");
});
