/**
 * Content-rendering fix (2026-09-28) — regression suite for the
 * `\textbf{}`/`\textit{}` production bug: explanation content authored
 * with literal LaTeX text-styling commands (never wrapped in a math
 * delimiter) was reaching students as raw backslash-brace text instead of
 * bold/italic formatting. See textFormatting.js's own docstring for the
 * full root-cause writeup.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { renderTextFormattingCommands } from "./textFormatting.js";

test("basic \\textbf{} and \\textit{} conversion", async (t) => {
  await t.test("\\textbf{} becomes <strong>", () => {
    assert.equal(
      renderTextFormattingCommands(String.raw`\textbf{Correct Answer:} D) Chimpanzee`),
      "<strong>Correct Answer:</strong> D) Chimpanzee",
    );
  });

  await t.test("\\textit{} becomes <em>", () => {
    assert.equal(renderTextFormattingCommands(String.raw`\textit{Pan troglodytes}`), "<em>Pan troglodytes</em>");
  });

  await t.test("multiple spans in one paragraph", () => {
    const input = String.raw`\textbf{Correct Answer:} D) Chimpanzee \textbf{Core Concept:} Molecular phylogenetics demonstrates that chimpanzees (\textit{Pan troglodytes} and \textit{Pan paniscus}) are the closest living relatives.`;
    const out = renderTextFormattingCommands(input);
    assert.match(out, /<strong>Correct Answer:<\/strong>/);
    assert.match(out, /<strong>Core Concept:<\/strong>/);
    assert.match(out, /<em>Pan troglodytes<\/em>/);
    assert.match(out, /<em>Pan paniscus<\/em>/);
    assert.doesNotMatch(out, /\\textbf|\\textit/, "no raw command text should remain");
  });

  await t.test("formatting mixed with ordinary text on both sides", () => {
    assert.equal(
      renderTextFormattingCommands(String.raw`before \textbf{middle} after`),
      "before <strong>middle</strong> after",
    );
  });
});

test("balanced braces / nesting", async (t) => {
  await t.test("nested \\textit{} inside \\textbf{} produces nested tags", () => {
    assert.equal(
      renderTextFormattingCommands(String.raw`\textbf{Core: \textit{important}}`),
      "<strong>Core: <em>important</em></strong>",
    );
  });

  await t.test("a brace-containing but unrelated LaTeX group inside the argument doesn't truncate the match", () => {
    assert.equal(
      renderTextFormattingCommands(String.raw`\textbf{Value is \frac{1}{2} exactly}`),
      "<strong>Value is \\frac{1}{2} exactly</strong>",
    );
  });

  await t.test("adjacent, non-nested commands back to back", () => {
    assert.equal(
      renderTextFormattingCommands(String.raw`\textbf{A}\textit{B}`),
      "<strong>A</strong><em>B</em>",
    );
  });
});

test("malformed input is never dropped", async (t) => {
  await t.test("unterminated \\textbf{ (no closing brace) is left as literal text", () => {
    assert.equal(renderTextFormattingCommands(String.raw`\textbf{unterminated`), String.raw`\textbf{unterminated`);
  });

  await t.test("a bare \\textbf not followed by { is left untouched", () => {
    assert.equal(renderTextFormattingCommands(String.raw`\textbf plain word`), String.raw`\textbf plain word`);
  });
});

test("math delimiters are preserved untouched — this module runs BEFORE math rendering", async (t) => {
  const mathCases = [
    String.raw`\(\textbf{F} = m\vec{a}\)`,
    String.raw`$\textit{v} = \frac{d}{t}$`,
    String.raw`\[\textbf{E} = mc^2\]`,
    String.raw`$$\textit{x}^2$$`,
  ];
  for (const input of mathCases) {
    await t.test(`unchanged: ${input}`, () => {
      assert.equal(renderTextFormattingCommands(input), input);
    });
  }

  await t.test("prose formatting outside a math span still converts, math span stays untouched", () => {
    const input = String.raw`\textbf{Correct Answer:} D. The kinetic energy is \(E_k = \frac{3}{2}k_BT\).`;
    const out = renderTextFormattingCommands(input);
    assert.match(out, /<strong>Correct Answer:<\/strong>/);
    assert.match(out, /\\\(E_k = \\frac\{3\}\{2\}k_BT\\\)/, "the math span's raw source must be untouched for the math pipeline");
  });
});

test("HTML tags are never scanned into — real markup and data attributes are never corrupted", async (t) => {
  await t.test("a \\textbf{}-shaped string inside an attribute value is left alone", () => {
    const input = `<div data-x="\\textbf{no}">plain</div>`;
    assert.equal(renderTextFormattingCommands(input), input);
  });

  await t.test("prose formatting around existing real HTML tags still works", () => {
    const input = String.raw`<p>\textbf{Bold}</p> and <strong>already bold</strong>`;
    assert.equal(renderTextFormattingCommands(input), "<p><strong>Bold</strong></p> and <strong>already bold</strong>");
  });
});

test("security: never produces anything DOMPurify wouldn't already need to sanitize normally", async (t) => {
  await t.test("a script tag inside the argument is preserved verbatim for the caller's sanitizer to strip", () => {
    // This module runs BEFORE DOMPurify (see RichContent.js/richHtml.js) —
    // it is not itself a sanitizer and must never be asked to be one. The
    // real safety property (the script never reaches the DOM) is proven in
    // richContentPipeline.test.mjs, which runs the exact same sequence
    // RichContent.js does, DOMPurify included.
    assert.equal(
      renderTextFormattingCommands(String.raw`\textbf{<script>alert(1)</script>}`),
      "<strong><script>alert(1)</script></strong>",
    );
  });
});

test("no input / empty input", async (t) => {
  await t.test("null/undefined/empty string all pass through renderRichHtml-style call sites safely", () => {
    assert.equal(renderTextFormattingCommands(""), "");
    assert.equal(renderTextFormattingCommands(null), null);
    assert.equal(renderTextFormattingCommands(undefined), undefined);
  });

  await t.test("plain text with no commands at all is returned unchanged", () => {
    const input = "No formatting commands anywhere in this sentence.";
    assert.equal(renderTextFormattingCommands(input), input);
  });
});
