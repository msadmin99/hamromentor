/**
 * Class-wide regression suite for "plain text rendered as KaTeX math".
 *
 * Production bug: content routinely wraps plain numbers, quantities,
 * chemical/biological names, ratios, angles and words in math delimiters
 * ($20$, \(800\ cc\), $\text{HCl}$, $9 : 3 : 3 : 1$, $180^\circ$,
 * $coelenteron$). KaTeX set them in the larger serif math font. The shared
 * renderer (renderRichHtml -> renderMathInHtml) must leave those as
 * ordinary text while every genuine expression still renders as math.
 *
 * Assertions are made on the parsed DOM (jsdom): plain content must not sit
 * inside .katex, genuine math must. Nothing here is question-specific.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

import { renderMathInHtml } from "./mathDelimiters.js";
import { renderRichHtml } from "./richHtml.js";
import { classifyMathSpan, trivialMathToText } from "./trivialMath.js";

const purify = createDOMPurify(new JSDOM("").window);
const dom = (html) => {
  const clean = purify.sanitize(renderRichHtml(html), {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_ATTR: ["style", "target"],
  });
  return new JSDOM(`<body><div id="r">${clean}</div></body>`).window.document.getElementById("r");
};
const inKatex = (root) => [...root.querySelectorAll(".katex")].map((n) => n.textContent);
const plainText = (root) => {
  const c = root.cloneNode(true);
  c.querySelectorAll(".katex").forEach((n) => n.remove());
  return c.textContent;
};

// ---- DEFINITELY PLAIN: every delimiter style, never inside .katex ---------
const PLAIN = [
  ["20", "20"], ["24", "24"], ["3.14", "3.14"], ["1,000", "1,000"], ["25\\%", "25%"], ["25%", "25%"],
  ["800 cc", "800 cc"], ["800\\ cc", "800 cc"], ["100\\,\\text{cc}", "100 cc"], ["800cc", "800cc"],
  ["60 kg", "60 kg"], ["1,000 kg", "1,000 kg"], ["5 kg", "5 kg"], ["5\\,m", "5 m"], ["10\\ m", "10 m"], ["10 cm", "10 cm"],
  ["100 mL", "100 mL"], ["20\\ s", "20 s"], ["2\\,A", "2 A"], ["5\\,V", "5 V"], ["298\\,K", "298 K"], ["500\\,mg", "500 mg"], ["5\\text{mg}", "5mg"], ["10\\text{ mg}", "10 mg"], ["180\\text{ mg/dL}", "180 mg/dL"], ["2\\,\\Omega", "2 Ω"], ["5\\ \\Omega", "5 Ω"], ["100 \\, \\Omega", "100 Ω"], ["20 \\ \\Omega", "20 Ω"], ["760 mmHg", "760 mmHg"],
  ["15 days", "15 days"], ["3 days", "3 days"], ["20, 24", "20, 24"], ["20, 24 and 15", "20, 24 and 15"],
  ["5 to 10", "5 to 10"],
  ["37^\\circ C", "37°C"], ["37^\\circ\\text{C}", "37°C"], ["180^\\circ", "180°"], ["45^{\\circ}", "45°"],
  ["9 : 3 : 3 : 1", "9 : 3 : 3 : 1"], ["9:3:3:1", "9:3:3:1"], ["1:2:1", "1:2:1"],
  ["\\text{HCl}", "HCl"], ["\\text{NaOH}", "NaOH"], ["\\text{DNA}", "DNA"], ["\\text{RNA}", "RNA"],
  ["70\\text{S}", "70S"], ["1\\text{ mole}", "1 mole"], ["2,4\\text{-D}", "2,4-D"],
  ["40\\text{--}50\\%", "40–50%"], ["14\\text{--}16", "14–16"], ["1955\\text{ Nobel Prize}", "1955 Nobel Prize"],
  ["\\text{Form a large number of oxides}", "Form a large number of oxides"],
  ["\\text{Allium cepa}", "Allium cepa"], // \text is already upright/roman in KaTeX: plain text is faithful
];
for (const [expr, text] of PLAIN) {
  for (const [open, close] of [["$", "$"], ["\\(", "\\)"]]) {
    test(`PLAIN stays out of KaTeX: ${open}${expr}${close}`, () => {
      const root = dom(`<p>The value ${open}${expr}${close} is given.</p>`);
      assert.deepEqual(inKatex(root), [], "must not be typeset as math");
      assert.equal(root.textContent, `The value ${text} is given.`);
      assert.equal(classifyMathSpan(expr).state, "plain");
    });
  }
}

// ---- DEFINITELY MATHEMATICAL + chemical formulas: must still use KaTeX ------
const MATH = [
  "x^2", "x_1", "x^{-1}", "\\frac{1}{2}", "\\frac12", "2\\times10^{-3}", "V^{-1}", "\\gamma=\\frac52", "P=20", "a=b",
  "\\alpha", "\\beta", "\\gamma", "\\pm 5", "a \\leq b", "a \\neq b", "\\sum_{i=1}^{n} i", "\\int_0^1 x\\,dx",
  "\\left(x\\right)", "-5", "1/2", "5x", "AB", "ax", "P", "V", "n", "2n", "3d", "Rr", "\\sqrt{2}", "x<6", "5-3",
  "(24/5)P", "\\vec{a}+\\vec{b}", "2 \\times 10^{-2}\\ mA \\cdot V^{-1}", "\\text{Speed} = v", "9\\frac{3}{4}",
  "5 x", "5m", "2A", "5s", "180^\\circ + x", "3mg", "5 mg", "2mg", "50\\% s", "50\\% kg",
  // chemical formulas written as LaTeX stay mathematical
  "H_2O", "CO_2", "Ca^{2+}", "Na^+", "Cl^-", "\\text{H}_2\\text{O}", "\\text{Na}^+", "\\text{SO}_4^{2-}", "\\text{HCl}^{-}",
  "\\mathrm{HCl}", "\\mathrm{H_2O}",
  // explicit typography commands are never demoted
  "\\textit{E. coli}", "\\textit{Allium cepa}", "\\mathit{Homo\\ sapiens}", "\\emph{Homo sapiens}",
];
for (const expr of MATH) {
  for (const [open, close] of [["$", "$"], ["\\(", "\\)"]]) {
    test(`MATH still renders with KaTeX: ${open}${expr}${close}`, () => {
      const root = dom(`<p>Given ${open}${expr}${close} here.</p>`);
      assert.equal(inKatex(root).length, 1, `${expr} should be one .katex node`);
      assert.equal(plainText(root), "Given  here.");
      assert.equal(trivialMathToText(expr), null);
      assert.notEqual(classifyMathSpan(expr).state, "plain");
    });
  }
}

// ---- AMBIGUOUS: uncertain -> keep as math (never silently demoted) ---------
// "number + typed space + single-letter/product-like unit" and mg/Omega forms:
// a typed space is invisible in math mode and the bank holds `0.4 V` (0.4 x
// volume) and `3mg` (physics), so these are KEPT as KaTeX (documented decision).
const KEPT_AS_MATH_UNITS = [
  "5 mg", "10 mg", "500 mg", "5mg", "10mg", "mg", "mg=9.8", "mg = 9.8", "5mg/L", "10mg/kg", "2mg \\times 3", "5\\mathrm{mg}",
  "5 V", "0.4 V", "10 m", "2 A", "20 s", "298 K", "1 N", "5m", "2A", "5s", "5\\Omega", "\\Omega", "2 \\Omega",
];
for (const expr of KEPT_AS_MATH_UNITS) {
  test(`kept as KaTeX (ambiguous unit form): $${expr}$`, () => {
    const root = dom(`<p>Given $${expr}$ here.</p>`);
    assert.equal(inKatex(root).length, 1);
    assert.equal(trivialMathToText(expr), null);
  });
}

const AMBIGUOUS = [
  "velocity", "distance", "acceleration", "pressure", "momentum", "frequency", "coelenteron", "Brassica",
  "Allium\\ cepa", "Homo\\ sapiens", "E.\\ coli", "days", "cc", "kilogram",
];
for (const expr of AMBIGUOUS) {
  test(`AMBIGUOUS is kept as KaTeX: ${expr}`, () => {
    const root = dom(`<p>The $${expr}$ here.</p>`);
    assert.equal(inKatex(root).length, 1);
    assert.equal(trivialMathToText(expr), null);
    assert.ok(["ambiguous", "math"].includes(classifyMathSpan(expr).state));
  });
}

test("three-state classifier labels", () => {
  assert.equal(classifyMathSpan("velocity").state, "ambiguous");
  assert.equal(classifyMathSpan("Allium\\ cepa").state, "ambiguous");
  assert.equal(classifyMathSpan("x^2").state, "math");
  assert.equal(classifyMathSpan("AB").state, "math");
  assert.equal(classifyMathSpan("Rr").state, "math");
  assert.equal(classifyMathSpan("5x").state, "math");
  assert.equal(classifyMathSpan("800 cc").state, "plain");
  assert.equal(classifyMathSpan("800 cc").kind, "number-unit");
  assert.equal(classifyMathSpan("20, 24 and 15").kind, "number-list");
  assert.equal(classifyMathSpan("9 : 3 : 3 : 1").kind, "ratio");
  assert.equal(classifyMathSpan("37^\\circ C").kind, "degree");
  assert.equal(classifyMathSpan("\\text{HCl}").kind, "text-group");
  assert.equal(classifyMathSpan("70\\text{S}").kind, "number-text");
});

test("a unit is never plain without a number directly before it", () => {
  for (const e of ["kg", "m", "s", "A", "5 x kg", "kg 5", "x 5 kg", "and", "5 and x", "to 5"]) {
    assert.equal(trivialMathToText(e), null, e);
  }
});

test("display math is never downgraded to plain text", () => {
  for (const src of ["$$5$$", "\\[20\\]", "$$\\text{HCl}$$", "$$800\\ cc$$"]) {
    const root = dom(`<p>${src}</p>`);
    assert.equal(root.querySelectorAll(".katex-display").length, 1, src);
  }
});

// ---- Mixed prose + math ------------------------------------------------------
test("mixed: quantity plain, variable math", () => {
  const root = dom("<p>The volume is $800 cc$ and pressure is $P$.</p>");
  assert.equal(inKatex(root).length, 1);
  assert.equal(plainText(root), "The volume is 800 cc and pressure is .");
});

test("mixed: gas compressed from 800 cc to 100 cc, gamma and P remain math", () => {
  const root = dom("<p>Gas is compressed from \\(800\\ cc\\) to \\(100\\ cc\\); \\(\\gamma=\\frac52\\), initial \\(P\\).</p>");
  assert.equal(inKatex(root).length, 2);
  assert.match(plainText(root), /^Gas is compressed from 800 cc to 100 cc; , initial \.$/);
});

test("mixed: several inline fragments, only real math is typeset", () => {
  const root = dom("<p>The values are \\(x=2\\), \\(y=3\\), and \\(z=5\\), each for 6 days ($6$ days).</p>");
  assert.equal(inKatex(root).length, 3);
  assert.ok(plainText(root).endsWith("each for 6 days (6 days)."));
});

test("mixed: given x=20, calculate y", () => {
  const root = dom("<p>Given \\(x=20\\), calculate the value of \\(y\\).</p>");
  assert.equal(inKatex(root).length, 2);
});

test("mixed: V^{-1} requirement", () => {
  const root = dom("<p>The value of \\(V^{-1}\\) is required.</p>");
  assert.equal(inKatex(root).length, 1);
});

// ---- Rich HTML + math --------------------------------------------------------
test("bold / italic / lists / line breaks coexist with plain and real math", () => {
  const root = dom(
    "<p><strong>Note:</strong> <em>in $20$ days</em><br>$x^2$ and $5 kg$</p><ul><li>$\\text{HCl}$ and $\\alpha$</li></ul>",
  );
  assert.equal(root.querySelectorAll("strong").length, 1);
  assert.equal(root.querySelectorAll("em").length, 1);
  assert.equal(root.querySelectorAll("br").length, 1);
  assert.equal(root.querySelectorAll("li").length, 1);
  assert.deepEqual(inKatex(root).length, 2); // x^2 and alpha
  assert.equal(root.querySelector("em").textContent, "in 20 days");
  assert.ok(root.textContent.includes("5 kg"));
  assert.ok(root.textContent.includes("HCl"));
});

test("a number split by inline formatting is never dropped", () => {
  const root = dom("<p>$<strong>20</strong>$ days</p>");
  assert.ok(root.textContent.includes("20"));
});

// ---- Classifier edge cases ---------------------------------------------------
test("plain classifier positives / negatives", () => {
  assert.equal(trivialMathToText("20, 24"), "20, 24");
  assert.equal(trivialMathToText("days"), null);
  assert.equal(trivialMathToText("m"), null);
  assert.equal(trivialMathToText("a_b"), null);
  assert.equal(trivialMathToText("\\text{a_b}"), null);
  assert.equal(trivialMathToText("\\text{if } x"), null);
  assert.equal(trivialMathToText("AaBbCcDdEe"), null);
  assert.equal(trivialMathToText("velocity"), null);
  assert.equal(trivialMathToText("HbNHCOOH"), null);
  assert.equal(trivialMathToText("3d"), null);
  assert.equal(trivialMathToText("1\\,RR : 2\\,Rr : 1\\,rr"), null);
  assert.equal(trivialMathToText(""), null);
  assert.equal(trivialMathToText(null), null);
});

test("renderMathInHtml (string layer): plain spans become text, math spans reach the renderer", () => {
  const seen = [];
  const out = renderMathInHtml("In $20$ days, $x^2$ and \\(5\\ kg\\)", (expr) => {
    seen.push(expr);
    return `<M>${expr}</M>`;
  });
  assert.equal(out, "In 20 days, <M>x^2</M> and 5 kg");
  assert.deepEqual(seen, ["x^2"]);
});

test("no question-, test- or subject-specific logic in the rendering rule", async () => {
  const { readFileSync } = await import("node:fs");
  for (const f of ["trivialMath.js", "richHtml.js", "mathDelimiters.js"]) {
    const src = readFileSync(new URL(`./${f}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    assert.doesNotMatch(src, /\bQ\d{2,4}\b|question[_-]?id|subject[_-]?id|test[_-]?id|Question 1\d\d/i, f);
  }
});
