/**
 * QBank 2.0 Explanation Redesign — presentation-only text/HTML segmentation
 * for question explanations.
 *
 * WHY THIS EXISTS: `Question.explanation` (and the identical shape on every
 * exam-type's result payload) is one free-text/HTML field. Two very
 * different kinds of content land in it in production:
 *
 *  1. Real HTML from the admin rich-text editor or the docx import pipeline
 *     (academics/importers/docx_parser.py) — genuine <p>/<ul>/<strong> tags,
 *     already reasonably structured.
 *  2. A single escaped plain-text blob from the CSV/XLSX/JSON bulk-import
 *     path (academics/importers/csv_parser.py, xlsx_parser.py: `_wrap_html`
 *     just does `<p>${html.escape(text)}</p>`, no markdown conversion, no
 *     paragraph/list detection) — this is where "**bold**", "- item" bullet
 *     lines, and literal newlines all land as inert characters inside one
 *     `<p>`, and where content authors typically type inline section labels
 *     like "Correct Answer: A) Skin ... Core Concept: ... Why Other Options
 *     Are Wrong: B) ... C) ... D) ...".
 *
 * This module turns either shape into a small structured object a
 * presentation component can render with real visual hierarchy — WITHOUT
 * touching the database, without an LLM rewrite, and without ever dropping
 * content it doesn't recognise. Every extraction step is optional and
 * additive: unrecognised content always still comes out somewhere (see
 * `sections.body`), never silently discarded.
 *
 * Intentionally dependency-free (no DOM, no dompurify, no katex) — same
 * discipline as mathDelimiters.js — so it is unit-testable under
 * `node --test` and safe to run on every render without a browser API.
 * Sanitization/actual rendering of the HTML this module produces is still
 * RichContent's job; this module only rearranges structure.
 */

// ---------------------------------------------------------------------
// Small HTML utilities (regex-based — the content here is never deeply
// nested in practice: a rich-text editor / bulk import never produces a
// <p> inside a <p>, so a lightweight scanner is enough and avoids pulling
// in a DOM parser dependency just for this).
// ---------------------------------------------------------------------

function stripTags(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LEAF_BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"];
const CONTAINER_BLOCK_TAGS = ["ul", "ol", "table", "div"];
const BLOCK_TAG_RE = /<(p|h[1-6]|ul|ol|blockquote|table|div|hr)\b[^>]*?>/i;

/** Splits an HTML string into an ordered list of top-level blocks:
 * `{ tag, inner, outer }`. `inner` is only meaningful (and only used) for
 * the "leaf" tags (p/h1-6/blockquote) — those are simple enough that a
 * section label can plausibly be the whole block or the start of it.
 * Container tags (ul/ol/table/div) and `hr` are carried through as an
 * opaque `outer` blob and are never candidates for a label match — a
 * label line is never itself a whole list/table in real content, and this
 * guarantees a real list/table can never be mis-split. */
function splitTopLevelBlocks(html) {
  const blocks = [];
  let pos = 0;
  const src = String(html || "");

  while (pos < src.length) {
    const rest = src.slice(pos);
    const m = BLOCK_TAG_RE.exec(rest);
    if (!m) {
      const tail = rest.trim();
      if (tail) blocks.push({ tag: "p", inner: rest, outer: `<p>${rest}</p>` });
      break;
    }
    const matchStart = m.index;
    const before = rest.slice(0, matchStart);
    if (before.trim()) blocks.push({ tag: "p", inner: before, outer: `<p>${before}</p>` });

    const tagName = m[1].toLowerCase();
    const openEnd = matchStart + m[0].length;

    if (tagName === "hr") {
      blocks.push({ tag: "hr", inner: "", outer: m[0] });
      pos += openEnd;
      continue;
    }

    if (CONTAINER_BLOCK_TAGS.includes(tagName)) {
      // Depth-aware scan — these CAN legitimately nest (a <ul> inside a
      // <li>, a <div> inside a <div>) so a naive "first closing tag" would
      // truncate early.
      const openRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
      const closeRe = new RegExp(`</${tagName}\\s*>`, "gi");
      openRe.lastIndex = openEnd;
      closeRe.lastIndex = openEnd;
      let depth = 1;
      let searchFrom = openEnd;
      let closeIdx = -1;
      while (depth > 0) {
        openRe.lastIndex = searchFrom;
        closeRe.lastIndex = searchFrom;
        const nextOpen = openRe.exec(rest);
        const nextClose = closeRe.exec(rest);
        if (!nextClose) {
          // Malformed/unclosed tag — take the rest of the string rather
          // than lose it.
          closeIdx = rest.length;
          break;
        }
        if (nextOpen && nextOpen.index < nextClose.index) {
          depth += 1;
          searchFrom = nextOpen.index + nextOpen[0].length;
        } else {
          depth -= 1;
          searchFrom = nextClose.index + nextClose[0].length;
          if (depth === 0) closeIdx = searchFrom;
        }
      }
      const outer = rest.slice(matchStart, closeIdx);
      blocks.push({ tag: tagName, inner: "", outer });
      pos += closeIdx;
      continue;
    }

    // Leaf block (p/h1-6/blockquote) — non-greedy to the first matching
    // close tag. These essentially never legitimately nest in this
    // content (an admin editor doesn't put a <p> inside a <p>).
    const closeRe = new RegExp(`</${tagName}\\s*>`, "i");
    const closeMatch = closeRe.exec(rest.slice(openEnd));
    const innerEnd = closeMatch ? openEnd + closeMatch.index : rest.length;
    const fullEnd = closeMatch ? innerEnd + closeMatch[0].length : rest.length;
    const inner = rest.slice(openEnd, innerEnd);
    blocks.push({ tag: tagName, inner, outer: rest.slice(matchStart, fullEnd) });
    pos += fullEnd;
  }

  return blocks;
}

// ---------------------------------------------------------------------
// Step 2 — reconstructing real paragraphs/lists/emphasis out of an
// escaped plain-text blob (the CSV/XLSX/JSON `_wrap_html` shape).
// ---------------------------------------------------------------------

/** `**bold**` / `__bold__` -> <strong>, `*italic*` / `_italic_` -> <em>.
 * Deliberately conservative on two fronts, verified against real medical
 * content shapes during the pre-commit safety audit:
 *  - Single-asterisk italic requires no whitespace immediately inside the
 *    markers (`*important*`, not `* important *`) — the same rule real
 *    Markdown parsers use to tell emphasis apart from a bare multiplication
 *    sign. Without this, a line with two separate multiplications
 *    ("5 * 3 = 15 ... 2 * 4 = 8") gets its own asterisks misread as one
 *    open/close pair spanning both, corrupting everything between them.
 *  - Single-underscore italic requires a non-alphanumeric boundary before
 *    the opening `_`, so LaTeX subscript notation ($k_{cat}$, $v_{max}$,
 *    $a_1$ — ubiquitous in biochem/kinetics explanations) is never treated
 *    as an italic marker: the underscore there is always glued directly to
 *    its base variable, which this boundary check rejects. A real
 *    snake_case-ish token or a stray citation underscore is protected the
 *    same way.
 * Never touches text it doesn't recognise as a complete pair. */
function applyInlineMarkdown(text) {
  let out = text;
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  out = out.replace(/\*(\S(?:[^*\n]*\S)?)\*/g, "<em>$1</em>");
  out = out.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
  return out;
}

/** True when a single leaf block's content is very likely raw, unrendered
 * plain text rather than deliberately-authored HTML — i.e. the exact
 * `_wrap_html`/CSV/XLSX shape this whole module exists for. Conservative
 * on purpose: a real short one-line explanation with none of these
 * signals is left completely untouched. */
function looksLikeEscapedPlainText(block) {
  if (!LEAF_BLOCK_TAGS.includes(block.tag)) return false;
  const inner = block.inner;
  if (/\r?\n/.test(inner)) return true;
  if (/\*\*[^*]+\*\*|__[^_]+__/.test(inner)) return true;
  const labelHits = SECTION_LABEL_DEFS.filter((def) => new RegExp(`\\b(?:${def.words})\\s*:`, "i").test(inner)).length;
  if (labelHits >= 2) return true;
  if (/^\s*[-*•]\s+\S/m.test(inner)) return true;
  return false;
}

function reconstructBlocksFromPlainText(inner) {
  const lines = inner.split(/\r?\n/);
  const blocks = [];
  let paragraphBuf = [];
  let listBuf = null; // { type: 'ul' | 'ol', items: [] }

  function flushParagraph() {
    if (paragraphBuf.length) {
      const joined = paragraphBuf.join(" ").trim();
      if (joined) blocks.push({ tag: "p", inner: joined, outer: `<p>${joined}</p>` });
      paragraphBuf = [];
    }
  }
  function flushList() {
    if (listBuf && listBuf.items.length) {
      const tag = listBuf.type;
      const outer = `<${tag}>${listBuf.items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`;
      blocks.push({ tag, inner: "", outer });
    }
    listBuf = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const bulletMatch = /^[-*•]\s+(.*)$/.exec(line);
    const numberMatch = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushParagraph();
      if (!listBuf || listBuf.type !== "ul") {
        flushList();
        listBuf = { type: "ul", items: [] };
      }
      listBuf.items.push(applyInlineMarkdown(bulletMatch[1]));
    } else if (numberMatch) {
      flushParagraph();
      if (!listBuf || listBuf.type !== "ol") {
        flushList();
        listBuf = { type: "ol", items: [] };
      }
      listBuf.items.push(applyInlineMarkdown(numberMatch[1]));
    } else {
      const converted = applyInlineMarkdown(line);
      // A label line ("**Core Concept:** ...", "Review Point: ...") always
      // starts a fresh block, even with no blank-line separator before it —
      // real bulk-uploaded text is typically one label per raw line with no
      // blank lines at all, so relying on blank lines alone would merge
      // multiple distinct labeled sections into one paragraph.
      if (isLabelLine(converted)) {
        flushParagraph();
        flushList();
      }
      paragraphBuf.push(converted);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

// ---------------------------------------------------------------------
// Step 3 — recognising the known bulk-upload section labels and
// segmenting blocks under them. Every label requires an immediately-
// following colon, so a sentence that merely starts with one of these
// words (no colon) is never mistaken for a heading.
// ---------------------------------------------------------------------

const SECTION_LABEL_DEFS = [
  { key: "correctAnswer", words: "correct\\s*answers?" },
  { key: "concept", words: "(?:the\\s*)?core\\s*concept|key\\s*concept|concept" },
  { key: "body", words: "detailed\\s*explanation|explanation|understand\\s*the\\s*mechanism|mechanism" },
  {
    key: "options",
    words:
      "why\\s*(?:the\\s*)?other\\s*options?\\s*(?:are\\s*)?(?:wrong|incorrect)|option\\s*analysis|why\\s*others?\\s*(?:are\\s*)?(?:wrong|incorrect)",
  },
  {
    key: "takeaway",
    words: "review\\s*point|key\\s*point|takeaway|remember|exam\\s*point|exam\\s*takeaway|high[\\s-]*yield\\s*point",
  },
];

// Common emoji this content uses AS a section marker (audit §16) — stripped
// only when immediately followed by a recognised label, never touched
// elsewhere in prose.
const MARKER_EMOJI = "(?:✅|✓|✔️?|🧠|📖|📚|❌|✗|🔵|💡|📌|⭐|🎯|📝|🔑|➡️?|→)";
const OPEN_INLINE = "(?:<(?:strong|b|em|i)>\\s*)*";
const CLOSE_INLINE = "(?:\\s*</(?:strong|b|em|i)>)*";

// Production bug (explanation redesign, stage 2): the markdown-lite bold
// conversion (applyInlineMarkdown) turns "**Core Concept:**" into
// "<strong>Core Concept:</strong>" — the COLON ends up INSIDE the tag
// pair, not after it. The original version of this pattern only allowed
// closing tags BEFORE the colon (matching hand-authored real HTML like
// "<strong>Core Concept</strong>:"), so for the markdown-converted shape
// it stopped consuming right after the colon and left "</strong>" stranded
// at the start of the section's own content — a real, visible dangling
// close-tag bug. CLOSE_INLINE now appears on both sides of the colon
// (each independently optional) so either real-content shape is consumed
// in full, regardless of which side of the punctuation the closing tag
// landed on.
function labelRegexFor(words) {
  return new RegExp(`^(?:\\s|&nbsp;)*(?:${MARKER_EMOJI}\\s*)?${OPEN_INLINE}(?:${words})${CLOSE_INLINE}\\s*:\\s*${CLOSE_INLINE}\\s*`, "i");
}

const LABEL_REGEXES = SECTION_LABEL_DEFS.map((def) => ({ key: def.key, re: labelRegexFor(def.words) }));

function isLabelLine(html) {
  return LABEL_REGEXES.some(({ re }) => re.test(html));
}

function segmentBlocks(blocks) {
  const sections = { concept: [], body: [], options: [], takeaway: [] };
  let current = "body";
  let anyLabelFound = false;

  // "Core Concept" is meant to be a short intro (see the target visual
  // structure), so it captures exactly ONE content-bearing block — either
  // the inline text right after "Core Concept:" on the same line, or (if
  // that line was a heading with nothing else on it) the very next block —
  // and then hands control back to `body`. Every other bucket
  // (`body`/`options`/`takeaway`) stays sticky across as many following
  // unlabeled blocks as exist: a multi-paragraph mechanism or a docx-style
  // one-paragraph-per-option breakdown must not be torn apart just because
  // later paragraphs carry no label of their own.
  function pushToCurrent(block) {
    sections[current].push(block);
    if (current === "concept") current = "body";
  }

  for (const block of blocks) {
    if (!LEAF_BLOCK_TAGS.includes(block.tag)) {
      pushToCurrent(block);
      continue;
    }
    let matched = null;
    for (const { key, re } of LABEL_REGEXES) {
      const m = re.exec(block.inner);
      if (m) {
        matched = { key, rest: block.inner.slice(m[0].length) };
        break;
      }
    }
    if (!matched) {
      pushToCurrent(block);
      continue;
    }
    anyLabelFound = true;
    if (matched.key === "correctAnswer") {
      // Redundant with the structured correct-option UI every caller
      // already renders — dropped, never duplicated. Body resumes right
      // after it (a stray "Correct Answer:" line never suppresses
      // whatever legitimately follows it).
      current = "body";
      continue;
    }
    current = matched.key;
    const restText = stripTags(matched.rest);
    if (restText) {
      pushToCurrent({ tag: block.tag, inner: matched.rest, outer: `<${block.tag}>${matched.rest}</${block.tag}>` });
    }
    // else: a heading-only line ("Core Concept:" with nothing after it) —
    // `current` is left as-is so the next block becomes its content.
  }

  return { sections, anyLabelFound };
}

function blocksToHtml(blocks) {
  return blocks.map((b) => b.outer || `<${b.tag}>${b.inner}</${b.tag}>`).join("");
}

// ---------------------------------------------------------------------
// Step 4 — parsing a free-text "why other options are wrong" section into
// per-letter rows, when the source never used the dedicated per-option
// Option.explanation field. Best-effort: any chunk this can't confidently
// attribute to a lettered option is kept, unparsed, as overflow text
// rather than dropped.
// ---------------------------------------------------------------------

/** Splits flattened option-analysis text into `{ letter, text }` chunks at
 * each "A)"-style marker. Returns [] if no letter markers are found at
 * all (caller then renders the section as plain flowing text).
 *
 * Deliberately `)` only, not `[).:]` — a pre-commit false-positive audit
 * found real prose like "seen in Type A. Type B reactions differ" (a
 * grading/classification mention, not an option reference) was being
 * mis-split at "A." and "B.", truncating and misattributing real content.
 * A bare period or colon after a single capital letter is far too common
 * in ordinary medical prose ("Grade A:", "Type B.") to safely treat as a
 * marker; every real example in the redesign brief uses "A)"/"B)", so
 * requiring the closing paren eliminates both known false-positive
 * classes without losing any real option-breakdown detection. */
function splitLetterChunks(flatText) {
  // A leading space is prepended before splitting: `String.split` has a
  // well-known quirk where a zero-width lookahead match sitting at index 0
  // of the string is never used as a split point at all (no captured
  // group, no leading empty string) — which would silently drop the FIRST
  // lettered option whenever the option-analysis text starts immediately
  // with "A)"/"B)" and no leading text before it (the common case once the
  // section label itself has already been stripped). The synthetic space
  // moves every real match at least one character in, sidestepping the
  // quirk; it contributes nothing to the captured chunk text below.
  const parts = ` ${flatText}`.split(/(?=\b([A-D])\)\s)/);
  const chunks = [];
  for (let i = 1; i < parts.length; i += 2) {
    const letter = parts[i];
    const chunkText = (parts[i + 1] || "").trim();
    if (chunkText) chunks.push({ letter, text: chunkText.replace(/^[A-D]\s*\)\s*/, "") });
  }
  return chunks;
}

/** Removes a leading repeat of the option's own text ("Ionic bonds: ...")
 * and a leading Incorrect/Wrong status word, leaving just the reasoning —
 * matching the target visual (§14: option label shown once, by the real
 * UI, not repeated inside the prose). Falls back to the untouched text if
 * the expected prefix isn't found, so nothing is ever silently cut. */
function stripOptionPrefix(text, realOptionText) {
  let t = text.trim();
  const optText = stripTags(realOptionText || "").trim();
  if (optText && t.toLowerCase().startsWith(optText.toLowerCase())) {
    t = t.slice(optText.length).trim();
  }
  t = t.replace(/^[:\-–]\s*/, "");
  let status = null;
  const statusMatch = /^(incorrect|wrong|false)\b\s*[:\-–]?\s*/i.exec(t);
  if (statusMatch) {
    status = statusMatch[1].toLowerCase();
    t = t.slice(statusMatch[0].length);
  }
  return { text: t.trim(), status };
}

/** `realOptions`: [{ id, letter, text }] — the app's own authoritative
 * option list (never inferred from prose). Returns a map letter -> parsed
 * { text, status }, or null per letter when no confident chunk exists for
 * it (caller keeps that option's row plain). */
function parseOptionAnalysisText(sectionHtml, realOptions) {
  const flat = stripTags(sectionHtml);
  const chunks = splitLetterChunks(flat);
  if (!chunks.length) return null;
  const byLetter = {};
  for (const { letter, text } of chunks) {
    const real = realOptions?.find((o) => o.letter === letter);
    byLetter[letter] = stripOptionPrefix(text, real?.text);
  }
  return byLetter;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Formats one question's `explanation` field into presentation sections.
 * Never throws — any unexpected input falls back to `{ body: rawHtml }`,
 * i.e. exactly today's behaviour (render the original HTML unchanged),
 * which is always a safe, correct rendering of the source of truth.
 *
 * `realOptions` (optional): [{ id, letter, text, isCorrect }] — used only
 * to clean up a free-text option-analysis section (see
 * parseOptionAnalysisText); never required for the concept/body/takeaway
 * segmentation above.
 */
export function formatExplanation(rawHtml, realOptions = null) {
  const empty = { concept: "", body: "", optionAnalysisHtml: "", optionAnalysisByLetter: null, takeaway: "", hasStructure: false };
  if (!rawHtml || !String(rawHtml).trim()) return empty;

  try {
    const rawBlocks = splitTopLevelBlocks(rawHtml);

    // Pre-commit safety audit finding: this used to only reconstruct when
    // the ENTIRE explanation was a single escaped-plain-text block — a
    // real explanation that mixes genuine HTML with a still-unconverted
    // escaped-text remainder (e.g. partially re-edited through the rich-
    // text editor after originally coming from a CSV/XLSX import) would
    // have its later block's raw "**bold**"/newlines pass through
    // untouched. Now evaluated per block, so each block is reconstructed
    // independently exactly when it individually looks like raw text —
    // a block that's already real HTML is never touched.
    const blocks = [];
    for (const block of rawBlocks) {
      if (looksLikeEscapedPlainText(block)) {
        const rebuilt = reconstructBlocksFromPlainText(block.inner);
        if (rebuilt.length) {
          blocks.push(...rebuilt);
          continue;
        }
      }
      blocks.push(block);
    }

    const { sections, anyLabelFound } = segmentBlocks(blocks);

    let optionAnalysisByLetter = null;
    let optionAnalysisHtml = "";
    if (sections.options.length) {
      optionAnalysisByLetter = parseOptionAnalysisText(blocksToHtml(sections.options), realOptions);
      if (!optionAnalysisByLetter) optionAnalysisHtml = blocksToHtml(sections.options);
    }

    return {
      concept: blocksToHtml(sections.concept),
      body: blocksToHtml(sections.body),
      optionAnalysisHtml,
      optionAnalysisByLetter,
      takeaway: blocksToHtml(sections.takeaway),
      hasStructure: anyLabelFound,
    };
  } catch {
    return { ...empty, body: rawHtml };
  }
}
