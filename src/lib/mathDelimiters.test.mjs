/**
 * Regression suite for the student-side math-delimiter bug: production
 * question/option/explanation HTML using MathJax-style `\(...\)`/`\[...\]`
 * delimiters (or a malformed nested pair) was showing up as literal LaTeX
 * source instead of rendered mathematics, because <RichContent> only ever
 * scanned for `$...$`/`$$...$$`.
 *
 * These tests exercise the pure delimiter-handling logic with a fake
 * renderer (no katex/dompurify/DOM dependency), so they run under plain
 * `node --test`. `richContentMath.test.mjs` layers real KaTeX on top of
 * this to prove the actual rendered output for every case in the bug
 * report.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyStandaloneLatex,
  decodeHtmlEntities,
  normalizeNestedDelimiters,
  renderMathInHtml,
  unwrapRedundant,
} from "./mathDelimiters.js";

// A stand-in for katex.renderToString that makes it easy to assert exactly
// which expression and which display mode reached the renderer.
const fakeRender = (expr, { displayMode }) => `<K${displayMode ? "D" : "I"}>${expr}</K${displayMode ? "D" : "I"}>`;

test("normalizeNestedDelimiters", async (t) => {
  await t.test("malformed inline-wrapping-display collapses to display, inner wins", () => {
    const out = normalizeNestedDelimiters(String.raw`\(\[\text{M L}^2\text{T}^{-2}\]\)`);
    assert.equal(out, String.raw`\[\text{M L}^2\text{T}^{-2}\]`);
  });

  await t.test("malformed display-wrapping-inline collapses to inline", () => {
    const out = normalizeNestedDelimiters(String.raw`\[\(x+y\)\]`);
    assert.equal(out, String.raw`\(x+y\)`);
  });

  await t.test("leaves a well-formed single pair untouched", () => {
    assert.equal(normalizeNestedDelimiters(String.raw`\(F=ma\)`), String.raw`\(F=ma\)`);
    assert.equal(normalizeNestedDelimiters(String.raw`\[E=mc^2\]`), String.raw`\[E=mc^2\]`);
  });

  await t.test("does not touch unrelated bracket-shaped text", () => {
    assert.equal(normalizeNestedDelimiters("array[i] and (x)"), "array[i] and (x)");
  });
});

test("unwrapRedundant", async (t) => {
  await t.test("strips one redundant \\(...\\) layer", () => {
    assert.equal(unwrapRedundant(String.raw`\(x^2\)`), "x^2");
  });
  await t.test("strips a $...$ layer", () => {
    assert.equal(unwrapRedundant("$x^2$"), "x^2");
  });
  await t.test("leaves a bare expression untouched", () => {
    assert.equal(unwrapRedundant("x^2"), "x^2");
  });
  await t.test("never fully empties out (guards against infinite/degenerate strip)", () => {
    assert.equal(unwrapRedundant(String.raw`\(\)`), String.raw`\(\)`);
  });
});

test("classifyStandaloneLatex (dedicated `latex` field)", async (t) => {
  await t.test("bare expression stays inline, unchanged", () => {
    assert.deepEqual(classifyStandaloneLatex("x^2"), { expr: "x^2", display: false });
  });
  await t.test("\\(...\\)-wrapped value is inline", () => {
    assert.deepEqual(classifyStandaloneLatex(String.raw`\(F=ma\)`), { expr: "F=ma", display: false });
  });
  await t.test("\\[...\\]-wrapped value is display", () => {
    assert.deepEqual(classifyStandaloneLatex(String.raw`\[E=mc^2\]`), { expr: "E=mc^2", display: true });
  });
  await t.test("malformed nested value normalises then classifies as display", () => {
    assert.deepEqual(classifyStandaloneLatex(String.raw`\(\[x\]\)`), { expr: "x", display: true });
  });
});

test("renderMathInHtml — the 10 bug-report cases", async (t) => {
  await t.test("1. dimensions of calorie, inline \\(...\\)", () => {
    const out = renderMathInHtml(String.raw`The dimensions of calorie are: \(ML^2T^{-2}\)`, fakeRender);
    assert.equal(out, "The dimensions of calorie are: <KI>ML^2T^{-2}</KI>");
    assert.doesNotMatch(out, /\\\(|\\\)/);
  });

  await t.test("2. coefficient of viscosity, \\text{} survives untouched", () => {
    const out = renderMathInHtml(String.raw`\(\text{dyn cm}^{-2}\text{s}\)`, fakeRender);
    assert.equal(out, String.raw`<KI>\text{dyn cm}^{-2}\text{s}</KI>`);
  });

  await t.test("3. universal gas constant, \\, spacing command survives", () => {
    const out = renderMathInHtml(String.raw`\(J\,K^{-1}mol^{-1}\)`, fakeRender);
    assert.equal(out, String.raw`<KI>J\,K^{-1}mol^{-1}</KI>`);
  });

  await t.test("4. power (FV)", () => {
    assert.equal(renderMathInHtml(String.raw`\(FV\)`, fakeRender), "<KI>FV</KI>");
  });

  await t.test("5. chemical formula H_2O reaches the renderer as-is (subscript is KaTeX's job)", () => {
    assert.equal(renderMathInHtml(String.raw`\(H_2O\)`, fakeRender), "<KI>H_2O</KI>");
  });

  await t.test("6. fraction", () => {
    assert.equal(renderMathInHtml(String.raw`\(\frac{F}{A}\)`, fakeRender), String.raw`<KI>\frac{F}{A}</KI>`);
  });

  await t.test("7. greek + nested fractions", () => {
    const out = renderMathInHtml(String.raw`\(\eta = \frac{F}{A}\frac{dv}{dx}\)`, fakeRender);
    assert.equal(out, String.raw`<KI>\eta = \frac{F}{A}\frac{dv}{dx}</KI>`);
  });

  await t.test("8. display equation \\[...\\] spanning multiple lines", () => {
    const out = renderMathInHtml("\\[\nPV=nRT\n\\]", fakeRender);
    assert.equal(out, "<KD>PV=nRT</KD>");
  });

  await t.test("9. mixed text with trailing punctuation preserved outside the math span", () => {
    const out = renderMathInHtml(String.raw`The SI unit of pressure is \(N\,m^{-2}\).`, fakeRender);
    assert.equal(out, String.raw`The SI unit of pressure is <KI>N\,m^{-2}</KI>.`);
  });

  await t.test("10. malformed legacy nesting normalises to a single display span", () => {
    const out = renderMathInHtml(String.raw`\(\[\text{M L}^2\text{T}^{-2}\]\)`, fakeRender);
    assert.equal(out, String.raw`<KD>\text{M L}^2\text{T}^{-2}</KD>`);
    // No stray delimiter characters of any kind leak into the output.
    assert.doesNotMatch(out, /\\\(|\\\)|\\\[|\\\]/);
  });
});

test("renderMathInHtml — multiple spans and delimiter styles in one string", async (t) => {
  await t.test("two inline spans plus a display span, in document order", () => {
    const out = renderMathInHtml(
      String.raw`Given \(a\) and \(b\), the result is \[a+b\].`,
      fakeRender
    );
    assert.equal(out, "Given <KI>a</KI> and <KI>b</KI>, the result is <KD>a+b</KD>.");
  });

  await t.test("legacy $...$ still works alongside \\(...\\) in the same document", () => {
    const out = renderMathInHtml(String.raw`Old: $x^2$. New: \(y^2\).`, fakeRender);
    assert.equal(out, "Old: <KI>x^2</KI>. New: <KI>y^2</KI>.");
  });
});

test("renderMathInHtml — never drops content", async (t) => {
  await t.test("an unbalanced \\( with no closing \\) is left exactly as-is", () => {
    const input = String.raw`broken \(a+b`;
    assert.equal(renderMathInHtml(input, fakeRender), input);
  });

  await t.test("a render() failure falls back to the original delimited source", () => {
    const throwing = () => {
      throw new Error("katex parse error");
    };
    const input = String.raw`\(\garbagecommand\)`;
    assert.equal(renderMathInHtml(input, throwing), input);
  });

  await t.test("a render() that returns null/empty falls back to the original source", () => {
    const input = String.raw`\(x\)`;
    assert.equal(renderMathInHtml(input, () => null), input);
    assert.equal(renderMathInHtml(input, () => ""), input);
  });

  await t.test("plain prose with no math is returned unchanged", () => {
    const input = "No math here at all, just a sentence.";
    assert.equal(renderMathInHtml(input, fakeRender), input);
  });

  await t.test("KaTeX-style output containing digits is never re-scanned as a math span", () => {
    // Guards the placeholder mechanism itself: if slot substitution used a
    // naive numeric token, digits inside the FIRST rendered span's own
    // output could be mistaken for a second placeholder.
    const digitHeavyRender = () => "<span>annotation 123 456</span>";
    const out = renderMathInHtml(String.raw`\(a\) and \(b\)`, digitHeavyRender);
    assert.equal(out, "<span>annotation 123 456</span> and <span>annotation 123 456</span>");
  });
});

test("decodeHtmlEntities", async (t) => {
  await t.test("decodes the standard named entities", () => {
    assert.equal(decodeHtmlEntities("K_a &lt; 6"), "K_a < 6");
    assert.equal(decodeHtmlEntities("M&gt;1"), "M>1");
    assert.equal(decodeHtmlEntities("A &amp; B"), "A & B");
    assert.equal(decodeHtmlEntities("5&nbsp;mg"), "5 mg");
    assert.equal(decodeHtmlEntities("&quot;quoted&quot; and &#39;apos&#39;"), '"quoted" and \'apos\'');
  });

  await t.test("decodes numeric and hex entities", () => {
    assert.equal(decodeHtmlEntities("&#60;&#62;"), "<>");
    assert.equal(decodeHtmlEntities("&#x3C;&#x3E;"), "<>");
  });

  await t.test("decodes exactly ONE level — a doubly-escaped value stays partially escaped, never over-decoded", () => {
    // &amp;lt; is genuinely a different string than &lt; — collapsing it
    // all the way to "<" would be guessing at intent this function
    // deliberately doesn't have. RichContent's collapseDoubleEncodedEntities
    // is the (separate, narrower) place double-encoding gets fixed.
    assert.equal(decodeHtmlEntities("&amp;lt;"), "&lt;");
  });

  await t.test("text with no entities at all is returned unchanged", () => {
    assert.equal(decodeHtmlEntities("Plain text, no entities."), "Plain text, no entities.");
  });

  await t.test("an unrecognised entity-shaped sequence is left as-is, never dropped", () => {
    assert.equal(decodeHtmlEntities("A &notarealentity; B"), "A &notarealentity; B");
  });

  await t.test("empty/null/undefined input never throws", () => {
    assert.equal(decodeHtmlEntities(""), "");
    assert.equal(decodeHtmlEntities(null), null);
    assert.equal(decodeHtmlEntities(undefined), undefined);
  });
});

test("bare (undelimited) LaTeX commands", async (t) => {
  await t.test("a bare command with no delimiters at all is still found and rendered", () => {
    const out = renderMathInHtml("A \\Rightarrow B", fakeRender);
    assert.equal(out, "A <KI>\\Rightarrow</KI> B");
  });

  await t.test("several different bare commands in one string are all found", () => {
    const out = renderMathInHtml("\\alpha decays to \\beta via \\rightarrow", fakeRender);
    assert.equal(out, "<KI>\\alpha</KI> decays to <KI>\\beta</KI> via <KI>\\rightarrow</KI>");
  });

  await t.test("a bare command already inside a real \\(...\\) expression is rendered once, not twice", () => {
    const out = renderMathInHtml(String.raw`\(A \Rightarrow B\)`, fakeRender);
    assert.equal(out, `<KI>A \\Rightarrow B</KI>`);
  });

  await t.test("a bare command's own {argument} is captured as part of the same span", () => {
    const out = renderMathInHtml("The rate is \\frac{a}{b} overall.", fakeRender);
    assert.equal(out, "The rate is <KI>\\frac{a}{b}</KI> overall.");
  });

  await t.test("a command name NOT on the allowlist is left completely untouched", () => {
    const input = "A \\notarealcommand B";
    assert.equal(renderMathInHtml(input, fakeRender), input);
  });

  await t.test("never matches inside an HTML tag — protects the Admin equation editor's own data-equation attribute", () => {
    const input = '<span data-equation="\\Rightarrow" class="hm-equation-render"><math>rendered</math></span>';
    assert.equal(renderMathInHtml(input, fakeRender), input, "the attribute value must never be touched");
  });

  await t.test("a longer coincidental word is not partially matched at the command-name prefix", () => {
    const input = "\\alphabetical order";
    assert.equal(renderMathInHtml(input, fakeRender), input);
  });

  await t.test("ordinary prose with a literal backslash-free sentence is completely unaffected", () => {
    const input = "This is a normal sentence with no math in it.";
    assert.equal(renderMathInHtml(input, fakeRender), input);
  });
});
