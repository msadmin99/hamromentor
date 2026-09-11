/**
 * Student-side math-delimiter handling for <RichContent>.
 *
 * The app renders LaTeX with KaTeX's *string* renderer
 * (`katex.renderToString`) so it works during SSR and inside content that
 * is injected via `dangerouslySetInnerHTML`. KaTeX's string renderer does
 * NOT scan for delimiters - the caller has to find each math span itself
 * and hand KaTeX the bare expression.
 *
 * Historically <RichContent> only scanned for TeX `$...$` / `$$...$$`
 * markers. A large amount of production question/option/explanation
 * content (typed by hand, or produced by the docx / bulk-import pipeline)
 * instead uses the MathJax-style delimiters `\( ... \)` (inline) and
 * `\[ ... \]` (display), and some legacy rows carry a malformed nested
 * pair like `\(\[ ... \]\)`. None of those were recognised, so the raw
 * LaTeX source - delimiters and all - fell straight through to the
 * browser as visible text.
 *
 * This module is intentionally dependency-free (no `katex`, no
 * `dompurify`, no DOM) so it is unit-testable under `node --test`. The
 * actual KaTeX call is injected by the caller.
 */

/**
 * Fix malformed legacy nesting from imports: an inline pair wrapping a
 * display pair, or vice-versa. The INNER delimiter wins the block/inline
 * decision, which is the required normalisation
 * (`\(\[ ... \]\)` -> `\[ ... \]`).
 *
 * Only collapses a *complete* wrapper whose inner span is itself a
 * complete opposite-type pair, so it can never eat a legitimate
 * expression.
 */
export function normalizeNestedDelimiters(input) {
  if (!input) return input;
  let out = String(input);
  let prev;
  do {
    prev = out;
    out = out
      .replace(/\\\(\s*\\\[([\s\S]*?)\\\]\s*\\\)/g, "\\[$1\\]")
      .replace(/\\\[\s*\\\(([\s\S]*?)\\\)\s*\\\]/g, "\\($1\\)");
  } while (out !== prev);
  return out;
}

/**
 * Strip redundant outer delimiter layers left by odd nesting such as
 * `\(\(x\)\)`, `\($x$\)` or `\(\[x\]\)` (once the block/inline choice has
 * already been made by the surrounding pass). Never touches an expression
 * that isn't *entirely* wrapped, so `a\(b\)c` is returned unchanged.
 */
export function unwrapRedundant(expr) {
  let out = String(expr == null ? "" : expr).trim();
  for (let i = 0; i < 4; i += 1) {
    const m =
      /^\\\(([\s\S]*)\\\)$/.exec(out) ||
      /^\\\[([\s\S]*)\\\]$/.exec(out) ||
      /^\$\$([\s\S]*)\$\$$/.exec(out) ||
      /^\$([\s\S]*)\$$/.exec(out);
    if (!m) break;
    const inner = m[1].trim();
    if (!inner || inner === out) break;
    out = inner;
  }
  return out;
}

/**
 * Classify a stand-alone LaTeX string (e.g. the dedicated `latex` field,
 * which normally holds a bare expression but is sometimes pasted with
 * delimiters). Returns `{ expr, display }` with the delimiters removed.
 */
export function classifyStandaloneLatex(raw) {
  const norm = normalizeNestedDelimiters(String(raw == null ? "" : raw).trim());
  let m = /^\\\[([\s\S]*)\\\]$/.exec(norm);
  if (m) return { expr: unwrapRedundant(m[1]), display: true };
  m = /^\$\$([\s\S]*)\$\$$/.exec(norm);
  if (m) return { expr: unwrapRedundant(m[1]), display: true };
  m = /^\\\(([\s\S]*)\\\)$/.exec(norm);
  if (m) return { expr: unwrapRedundant(m[1]), display: false };
  m = /^\$([\s\S]*)\$$/.exec(norm);
  if (m) return { expr: unwrapRedundant(m[1]), display: false };
  return { expr: unwrapRedundant(norm), display: false };
}

/*
 * Display-mode delimiters are scanned before inline ones so a `\[ ... \]`
 * span is never mis-split by the inline `\( ... \)` / `$ ... $` pass. The
 * inline `$ ... $` rule keeps its original shape (no newlines, non-empty)
 * so plain prose containing a lone `$` is left alone exactly as before.
 */
const DELIMITERS = [
  { display: true, re: /\$\$([\s\S]+?)\$\$/g },
  { display: true, re: /\\\[([\s\S]+?)\\\]/g },
  { display: false, re: /\\\(([\s\S]+?)\\\)/g },
  { display: false, re: /\$([^$\n]+?)\$/g },
];

// Placeholder wrapper used while later delimiter passes still need to run.
// U+E000 is a Unicode Private Use Area code point with no legitimate
// occurrence in question/option/explanation HTML, so a slot index wrapped
// between two of them can never collide with real content (including
// plain digits or numbers that were left un-rendered).
const PUA = String.fromCharCode(0xe000);
const openSlot = (n) => `${PUA}${n}${PUA}`;
const SLOT_RE = new RegExp(`${PUA}(\\d+)${PUA}`, "g");

/**
 * Replace every `$...$`, `$$...$$`, `\(...\)` and `\[...\]` span in `html`
 * with `render(expr, { displayMode })`.
 *
 * - Malformed nested delimiters are normalised first.
 * - Each rendered span is parked behind the PUA placeholder above and only
 *   swapped back in at the very end, so KaTeX output (which embeds the
 *   TeX source itself inside a MathML `<annotation>`) can never be
 *   re-scanned by a later delimiter pass.
 * - If `render` returns a non-string / empty value, or throws, the
 *   ORIGINAL delimited source is kept verbatim - content is never
 *   silently dropped.
 */
export function renderMathInHtml(html, render) {
  if (!html) return html;
  const slots = [];
  let out = normalizeNestedDelimiters(html);

  for (const { display, re } of DELIMITERS) {
    out = out.replace(re, (match, expr) => {
      const cleaned = unwrapRedundant(expr);
      if (!cleaned) return match;
      let rendered;
      try {
        rendered = render(cleaned, { displayMode: display });
      } catch {
        return match;
      }
      if (typeof rendered !== "string" || !rendered) return match;
      slots.push(rendered);
      return openSlot(slots.length - 1);
    });
  }

  return out.replace(SLOT_RE, (_, i) => slots[Number(i)] ?? "");
}
