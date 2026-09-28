// Content-rendering fix (2026-09-28): registers \ce{...} (mhchem) as a
// valid KaTeX command, globally, for every katex.renderToString call in
// this bundle (this module's own renderInlineLatex below, RichContent.js's
// separate direct call for the `latex` field, and mathDelimiters.js's
// legacy-chemistry-formula rewrite, which emits \ce{...} for KaTeX to
// render). A side-effect-only import — it mutates katex's shared macro
// registry and exports nothing itself. Placed first, above every other
// import, so it always runs before any katex.renderToString call anywhere
// downstream of this module (ES module evaluation order guarantees an
// imported module's top-level code runs before the importing module's
// own code does).
import "katex/contrib/mhchem";

import katex from "katex";
import { decodeHtmlEntities, renderMathInHtml } from "./mathDelimiters.js";
import { renderTextFormattingCommands } from "./textFormatting.js";

// Pure (DOM-free) part of <RichContent>'s pipeline, split out so it can be
// unit-tested and DOM-verified under `node --test` (RichContent.js itself
// imports dompurify and JSX). RichContent calls renderRichHtml() and then
// sanitizes the result.

/** Explanation redesign, stage 2 — production bug: a value that was
 * legitimately HTML-escaped once at import time (e.g. bulk-import content
 * containing a literal "&" or comparison operator) occasionally reaches
 * this component already escaped a SECOND time — "&amp;lt;" instead of
 * "&lt;" — most likely from a content author copy-pasting already-escaped
 * markup, or re-saving already-escaped text through a path that escapes
 * again. A double-escaped "&amp;lt;" only ever decodes ONE level through
 * normal HTML parsing, leaving the literal text "&lt;" visible to the
 * student. This collapses exactly one extra level of encoding for the five
 * standard entities — never a blind global string replace, and never
 * touching a genuinely single-escaped (i.e. correct) "&lt;", which this
 * regex cannot match at all since it requires the literal "&amp;" prefix. */
export function collapseDoubleEncodedEntities(html) {
  if (!html) return html;
  return html.replace(/&amp;(lt|gt|amp|quot|apos|#39);/g, "&$1;");
}

/** The docx/rich-text import pipeline splits a LaTeX command across separate
 * bold/italic runs when only part of it was styled in the source document —
 * e.g. "\vec{A}" with just "vec" bolded comes back as "\<strong>vec</strong>{A}",
 * which breaks the command and makes KaTeX render its own garbled error output
 * instead of throwing (throwOnError is off). LaTeX never legitimately contains
 * a literal "<letter" tag-shaped run, so stripping any embedded tags from
 * inside a captured math expression before handing it to KaTeX recovers the
 * original command cleanly. */
export function stripEmbeddedTags(expr) {
  return expr.replace(/<\/?[a-zA-Z][^>]*>/g, "").replace(/&lt;\/?[a-zA-Z][^&]*?&gt;/g, "");
}

/** Bulk-imported questions sometimes carry raw LaTeX source typed straight into
 * a Word/Excel cell instead of using the admin's equation-editor button — the
 * import pipeline has no way to know that's math, so it lands in `text` as
 * literal characters. Production content uses a mix of TeX `$...$`/`$$...$$`
 * markers AND MathJax-style `\(...\)`/`\[...\]` delimiters (plus, on some
 * legacy rows, a malformed nested pair like `\(\[...\]\)`) — `renderMathInHtml`
 * (src/lib/mathDelimiters.js) recognises all four and normalises the
 * malformed nesting before handing each bare expression to KaTeX, so it
 * doesn't matter which delimiter style a given row happens to use. */
export function renderInlineLatex(html) {
  if (!html) return html;
  return renderMathInHtml(html, (expr, { displayMode }) => {
    // decodeHtmlEntities BEFORE stripEmbeddedTags: an entity-encoded tag
    // ("&lt;strong&gt;...&lt;/strong&gt;") becomes a real tag first, so the
    // existing tag-stripping regex below catches it the same way it always
    // caught a literal <strong> — see decodeHtmlEntities's own docstring
    // in mathDelimiters.js for the production bug this closes (a real "<"/
    // ">" comparison operator inside a math expression, legitimately
    // HTML-escaped by the storage layer, must reach KaTeX as the literal
    // character it represents, not as unrendered entity text).
    const cleaned = stripEmbeddedTags(decodeHtmlEntities(expr)).trim();
    if (!cleaned) return null;
    try {
      return katex.renderToString(cleaned, { throwOnError: false, displayMode });
    } catch {
      return null;
    }
  });
}


/** collapse double-encoded entities, convert standalone \textbf{}/\textit{}
 * prose commands to real <strong>/<em> tags, then render math. Text-
 * formatting runs BEFORE math rendering, on the still-raw LaTeX source —
 * see textFormatting.js's own docstring for why that ordering is what
 * lets it safely leave a legitimate \textbf{}/\textit{} occurrence INSIDE
 * a genuine math expression (e.g. \(\textbf{F} = m\vec{a}\)) completely
 * untouched for KaTeX's own native support of those commands, rather than
 * risking it splicing raw HTML into what's about to be handed to KaTeX as
 * TeX source. Sanitizing the final result is still the caller's job. */
export function renderRichHtml(html) {
  return renderInlineLatex(renderTextFormattingCommands(collapseDoubleEncodedEntities(html)));
}
