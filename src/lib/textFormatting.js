/**
 * Prose-formatting command support for <RichContent> — content-rendering
 * fix (2026-09-28): production question/option/explanation content
 * (mostly AI-generated / bulk-import authored) routinely contains literal
 * LaTeX text-styling commands typed directly into prose, OUTSIDE any math
 * delimiter — `\textbf{Correct Answer:}`, `\textit{Pan troglodytes}` —
 * clearly intended as "bold this label" / "italicise this species name",
 * never intended to reach the student as raw backslash-brace text. Before
 * this module, nothing in the pipeline recognised these at all: they
 * aren't Markdown (explanationFormatter.js's applyInlineMarkdown only
 * knows `**bold**`/`*italic*`), and they aren't inside a math delimiter
 * (mathDelimiters.js only ever looks at what's already between `$...$`/
 * `\(...\)`), so they fell straight through to the browser as literal
 * text — exactly what the production screenshots showed.
 *
 * This is a LIMITED, EXPLICIT parser for exactly `\textbf{...}` and
 * `\textit{...}` — not a general TeX interpreter. It:
 *  - correctly balances nested braces, so `\textbf{Core: \textit{x}}`
 *    produces `<strong>Core: <em>x</em></strong>`, not a truncated match;
 *  - skips real HTML tags verbatim (never scans inside a `<...>` run, so
 *    it can never corrupt existing markup or an admin data-* attribute —
 *    the same technique mathDelimiters.js's wrapBareLatexCommands uses);
 *  - skips text already inside a $...$/\(...\)/\[...\]/$$...$$ math
 *    delimiter verbatim — KaTeX already natively supports \textbf{}/
 *    \textit{} as math-mode text-styling commands, so a genuine
 *    occurrence there (e.g. `\(\textbf{F} = m\vec{a}\)`) is left
 *    completely alone for mathDelimiters.js to render as-is. This module
 *    runs BEFORE that pipeline (see richHtml.js's renderRichHtml), so it
 *    only ever sees still-raw, undelimited LaTeX source — recognising a
 *    math span by its own delimiter tokens needs no KaTeX awareness;
 *  - never drops content: a `\textbf{` with no matching closing brace (a
 *    malformed/truncated row) is left as literal text, unchanged, rather
 *    than silently eaten or throwing.
 *
 * Output is real HTML (`<strong>`/`<em>`, no attributes) — RichContent.js
 * still runs the whole result through DOMPurify afterward exactly as
 * before, so this module's own output carries no more trust than any
 * other HTML this pipeline already produces.
 *
 * Dependency-free (no DOM, no katex) — same discipline as
 * mathDelimiters.js/explanationFormatter.js — unit-testable under
 * `node --test`.
 */

const MATH_DELIMITER_PAIRS = [
  ["$$", "$$"],
  ["\\[", "\\]"],
  ["\\(", "\\)"],
  ["$", "$"],
];

const TEXT_COMMANDS = { textbf: "strong", textit: "em" };
const COMMAND_TOKENS = Object.keys(TEXT_COMMANDS).map((name) => [`\\${name}`, TEXT_COMMANDS[name]]);

function findMathSpanEnd(str, openIdx, opener, closer) {
  const searchFrom = openIdx + opener.length;
  const closeIdx = str.indexOf(closer, searchFrom);
  return closeIdx === -1 ? -1 : closeIdx + closer.length;
}

function matchHtmlTagEnd(str, i) {
  if (str[i] !== "<") return -1;
  const closeIdx = str.indexOf(">", i + 1);
  return closeIdx === -1 ? -1 : closeIdx + 1;
}

/** Scans from `braceIdx` (must be the opening "{") to its balanced
 * matching "}". Returns `{ content, end }` (`end` is exclusive, just past
 * the closing brace) or null if the braces never balance before the end
 * of the string. */
function scanBalancedBraces(str, braceIdx) {
  if (str[braceIdx] !== "{") return null;
  let depth = 0;
  for (let i = braceIdx; i < str.length; i += 1) {
    if (str[i] === "{") depth += 1;
    else if (str[i] === "}") {
      depth -= 1;
      if (depth === 0) return { content: str.slice(braceIdx + 1, i), end: i + 1 };
    }
  }
  return null;
}

export function renderTextFormattingCommands(html) {
  if (!html) return html;
  const src = String(html);
  let out = "";
  let i = 0;

  while (i < src.length) {
    const tagEnd = matchHtmlTagEnd(src, i);
    if (tagEnd !== -1) {
      out += src.slice(i, tagEnd);
      i = tagEnd;
      continue;
    }

    let matchedMath = false;
    for (const [opener, closer] of MATH_DELIMITER_PAIRS) {
      if (src.startsWith(opener, i)) {
        const end = findMathSpanEnd(src, i, opener, closer);
        if (end !== -1) {
          out += src.slice(i, end);
          i = end;
          matchedMath = true;
          break;
        }
      }
    }
    if (matchedMath) continue;

    let matchedCommand = false;
    for (const [token, tag] of COMMAND_TOKENS) {
      if (src.startsWith(token, i) && src[i + token.length] === "{") {
        const braced = scanBalancedBraces(src, i + token.length);
        if (braced) {
          const inner = renderTextFormattingCommands(braced.content); // recurse — supports nesting
          out += `<${tag}>${inner}</${tag}>`;
          i = braced.end;
          matchedCommand = true;
          break;
        }
      }
    }
    if (matchedCommand) continue;

    out += src[i];
    i += 1;
  }

  return out;
}
