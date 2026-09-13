/**
 * Regression coverage for the explanation-redesign parser
 * (explanationFormatter.js). Test content mirrors the exact bulk-upload
 * patterns this module exists for (see that file's own docstring and the
 * QBank 2.0 Explanation Redesign brief) rather than generic lorem ipsum —
 * the labeled-section / emoji-marker / inline-option-breakdown shapes
 * below are the real production authoring patterns this must handle.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatExplanation } from "./explanationFormatter.js";

test("plain, unlabeled explanation (the common case) passes through as body with no invented sections", () => {
  const raw =
    "<p>The trabeculated part of the right ventricle is formed from the proximal 1/3rd of the bulbus cordis.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, false);
  assert.equal(out.concept, "");
  assert.equal(out.takeaway, "");
  assert.equal(out.optionAnalysisByLetter, null);
  assert.match(out.body, /proximal 1\/3rd of the bulbus cordis/);
});

test("empty/blank explanation returns the empty shape, not a thrown error", () => {
  assert.deepEqual(formatExplanation(""), {
    concept: "", body: "", optionAnalysisHtml: "", optionAnalysisByLetter: null, takeaway: "", hasStructure: false,
  });
  assert.equal(formatExplanation(null).hasStructure, false);
  assert.equal(formatExplanation("   ").body, "");
});

test("real multi-paragraph HTML (docx import shape) is segmented by label without being torn apart", () => {
  const raw =
    "<p><strong>Core Concept:</strong> Vitamin D synthesis begins in the skin.</p>" +
    "<p>UVB radiation converts 7-dehydrocholesterol into pre-vitamin D3, which isomerizes to vitamin D3.</p>" +
    "<p><strong>Review Point:</strong> Vitamin D synthesis begins in the skin through UVB-dependent conversion of 7-dehydrocholesterol.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, true);
  // Exact-equality, not substring match: a substring check alone would
  // have missed the real dangling-</strong> bug this section's own fix
  // comment describes — it only asserted the END of the string, so a
  // stray tag left at the START never failed this test even before the
  // fix. See "AUDIT: label colon lands INSIDE <strong>...</strong>" below
  // for the markdown-converted variant of the same bug.
  assert.equal(out.concept, "<p>Vitamin D synthesis begins in the skin.</p>");
  assert.match(out.body, /isomerizes to vitamin D3/);
  assert.doesNotMatch(out.body, /Core Concept/i, "the label text itself must not leak into the rendered body");
  assert.equal(out.takeaway, "<p>Vitamin D synthesis begins in the skin through UVB-dependent conversion of 7-dehydrocholesterol.</p>");
});

test("AUDIT: a label whose colon lands INSIDE <strong>...</strong> (the exact shape applyInlineMarkdown produces) leaves no dangling close tag", () => {
  // Real bug found during the stage-2 audit: **Core Concept:** converts to
  // <strong>Core Concept:</strong> — the colon ends up BEFORE the closing
  // tag, not after it. The label regex originally only handled closing
  // tags landing before the colon (the hand-authored-HTML shape in the
  // test above), so it stopped consuming right after the colon and left
  // "</strong>" as literal, visible stray markup at the start of the
  // section's rendered content.
  const raw =
    "<p>**Core Concept:** The reaction proceeds when the pH rises.\n" +
    "**Detailed Explanation:**\n" +
    "- Step one happens\n" +
    "- Step two happens</p>";
  const out = formatExplanation(raw);
  assert.equal(out.concept, "<p>The reaction proceeds when the pH rises.</p>");
  assert.doesNotMatch(out.concept, /<\/strong>|<strong>/, "no stray or leftover bold tag may remain");
  assert.equal(out.body, "<ul><li>Step one happens</li><li>Step two happens</li></ul>");
});

test("emoji-prefixed labels (the exact current-production pattern) are recognised and stripped", () => {
  const raw =
    "<p>✅ Correct Answer: A) Skin</p>" +
    "<p>🧠 Core Concept: This question tests vitamin D synthesis.</p>" +
    "<p>📖 Detailed Explanation: Full mechanism text goes here.</p>" +
    "<p>🔵 Review Point: Remember the skin origin.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, true);
  // Correct Answer is dropped entirely — every caller already renders it
  // from structured is_correct/correct_option_id data, never from prose.
  assert.doesNotMatch(out.concept + out.body + out.takeaway, /Correct Answer/i);
  assert.doesNotMatch(out.concept + out.body + out.takeaway, /✅|🧠|📖|🔵/);
  assert.match(out.concept, /tests vitamin D synthesis/);
  assert.match(out.body, /Full mechanism text/);
  assert.match(out.takeaway, /Remember the skin origin/);
});

test("a bulk-imported single escaped <p> blob (CSV/XLSX shape) is reconstructed into real paragraphs/lists/bold", () => {
  // This is exactly what academics/importers/csv_parser.py's _wrap_html
  // produces: html.escape(text) wrapped in one <p> — raw newlines and
  // literal ** markers, never converted.
  const raw =
    "<p>**Correct Answer:** A) Skin\n" +
    "**Core Concept:** Vitamin D synthesis begins in the skin.\n" +
    "**Detailed Explanation:**\n" +
    "- UVB exposure converts 7-dehydrocholesterol\n" +
    "- Pre-vitamin D3 forms in the epidermis\n" +
    "- The liver and kidney activate it\n" +
    "**Review Point:** Vitamin D synthesis starts in the skin.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, true);
  // No raw markdown asterisks anywhere in the output.
  assert.doesNotMatch(out.concept + out.body + out.takeaway, /\*\*/);
  assert.match(out.concept, /Vitamin D synthesis begins in the skin/);
  assert.match(out.body, /<li>UVB exposure converts 7-dehydrocholesterol<\/li>/);
  assert.match(out.body, /<ul>/);
  assert.match(out.takeaway, /Vitamin D synthesis starts in the skin/);
});

test("free-text option breakdown ('B) ... Incorrect ...') is parsed per-letter and matched to real options", () => {
  const raw =
    "<p>Why Other Options Are Wrong: " +
    "B) Ionic bonds: Incorrect - these form between charged side chains, not the peptide backbone. " +
    "C) Hydrogen bonds: Incorrect - these stabilize secondary structure, not primary sequence. " +
    "D) Disulfide bonds: Incorrect - these are tertiary-structure crosslinks.</p>";
  const realOptions = [
    { id: 1, letter: "A", text: "Peptide bonds", isCorrect: true },
    { id: 2, letter: "B", text: "Ionic bonds", isCorrect: false },
    { id: 3, letter: "C", text: "Hydrogen bonds", isCorrect: false },
    { id: 4, letter: "D", text: "Disulfide bonds", isCorrect: false },
  ];
  const out = formatExplanation(raw, realOptions);
  assert.ok(out.optionAnalysisByLetter, "should confidently parse per-letter chunks, not fall back to raw text");
  assert.match(out.optionAnalysisByLetter.B.text, /form between charged side chains/);
  assert.equal(out.optionAnalysisByLetter.B.status, "incorrect");
  assert.match(out.optionAnalysisByLetter.C.text, /stabilize secondary structure/);
  assert.match(out.optionAnalysisByLetter.D.text, /tertiary-structure crosslinks/);
  // The repeated option name itself is stripped, not duplicated under the
  // real option label the UI already renders.
  assert.doesNotMatch(out.optionAnalysisByLetter.B.text, /^Ionic bonds/i);
});

test("an option-analysis section with no lettered markers falls back to plain flowing text, never dropped", () => {
  const raw = "<p>Why Other Options Are Wrong: The other choices describe unrelated bonding patterns entirely.</p>";
  const out = formatExplanation(raw, []);
  assert.equal(out.optionAnalysisByLetter, null);
  assert.match(out.optionAnalysisHtml, /unrelated bonding patterns entirely/);
});

test("markdown bold on a real medical term inside otherwise-plain text renders as <strong>, never raw asterisks", () => {
  const raw = "<p>**Primary structure** refers to the linear sequence of amino acids.</p>";
  const out = formatExplanation(raw);
  // No explicit label here, so this whole thing is unstructured body text —
  // but the bold marker must still resolve to a real tag once the
  // escaped-plain-text path kicks in (bullet/newline aren't present, but a
  // markdown marker alone is enough to trigger it).
  assert.doesNotMatch(out.body, /\*\*/);
  assert.match(out.body, /<strong>Primary structure<\/strong>/);
});

test("a short one-line explanation with a stray single asterisk is left completely alone (no false-positive reconstruction)", () => {
  const raw = "<p>Vitamin A * carotene metabolism is discussed in Chapter 4.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, false);
  assert.equal(out.body, raw);
});

test("existing real HTML with tables/images is passed through unmodified when unlabeled (never mangled)", () => {
  const raw =
    '<p>See the comparison below.</p><table data-table-style="blue"><tr><th>A</th><th>B</th></tr></table>' +
    '<img src="https://example.com/x.png" alt="" />';
  const out = formatExplanation(raw);
  assert.match(out.body, /<table data-table-style="blue">/);
  assert.match(out.body, /<img src="https:\/\/example\.com\/x\.png"/);
});

test("malformed/unbalanced HTML never throws — falls back to the raw source verbatim", () => {
  const raw = "<p>Unclosed paragraph with <strong>bold that never closes";
  assert.doesNotThrow(() => formatExplanation(raw));
  const out = formatExplanation(raw);
  assert.match(out.body + out.concept, /bold that never closes/);
});

test("a heading-only label line with nothing else on it contributes no empty section", () => {
  const raw = "<p>Core Concept:</p><p>Real content follows on its own line.</p>";
  const out = formatExplanation(raw);
  assert.match(out.concept, /Real content follows on its own line/);
});

test("LaTeX delimiters inside explanation text are preserved verbatim (rendering is RichContent's job, not this parser's)", () => {
  const raw = "<p>Core Concept: The rate law is \\(k[A]^2\\) for a second-order reaction.</p>";
  const out = formatExplanation(raw);
  assert.match(out.concept, /\\\(k\[A\]\^2\\\)/);
});

/**
 * Pre-commit production-safety audit — targeted false-positive coverage.
 * Each test below reproduces a specific real-content shape the audit was
 * asked to check for; several caught genuine bugs that are now fixed
 * (see explanationFormatter.js's own comments at the fixed sites).
 */

test("AUDIT: A/B/C/D letters in ordinary prose (no options label) are never split or altered", () => {
  const raw = "<p>Core Concept: This is seen in Type A hypersensitivity, not Type B or C reactions.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.concept, "<p>This is seen in Type A hypersensitivity, not Type B or C reactions.</p>");
});

test("AUDIT: a bare period/colon after a single capital letter inside an options section is not mistaken for a new option marker", () => {
  // Real bug found during the audit: "Type A." and "Type B." (grading
  // language, not option references) were previously split as if they
  // were "A)"/"B)" markers, truncating and misattributing the real B
  // option's text. Only ")" is treated as a marker now.
  const raw =
    "<p>Why Other Options Are Wrong: B) Ionic bonds: Incorrect - seen in Type A. Type B reactions differ. " +
    "C) Hydrogen bonds: Incorrect - unrelated mechanism entirely.</p>";
  const realOptions = [
    { letter: "A", text: "Peptide bonds" },
    { letter: "B", text: "Ionic bonds" },
    { letter: "C", text: "Hydrogen bonds" },
  ];
  const out = formatExplanation(raw, realOptions);
  assert.ok(!out.optionAnalysisByLetter.A, "no fabricated entry for A — it was never actually broken out as its own option here");
  assert.match(out.optionAnalysisByLetter.B.text, /seen in Type A\. Type B reactions differ\./, "B's full text must survive intact, not be truncated at the false split");
  assert.match(out.optionAnalysisByLetter.C.text, /unrelated mechanism entirely/);
});

test("AUDIT: two separate multiplication asterisks on one line are not merged into a fake italic span", () => {
  // Real bug found during the audit: "5 * 3 ... 2 * 4" treated the first
  // and second asterisk as one open/close emphasis pair, swallowing
  // everything between them (a real number/equation-corruption risk).
  const raw = "<p>Detailed Explanation:\nThe rate is 5 * 3 = 15, and separately 2 * 4 = 8 in the control group.</p>";
  const out = formatExplanation(raw);
  assert.doesNotMatch(out.body, /<em>/);
  assert.match(out.body, /5 \* 3 = 15, and separately 2 \* 4 = 8/);
});

test("AUDIT: LaTeX subscript notation ($k_{cat}$, $v_{max}$) is never read as underscore-italic markdown", () => {
  const raw =
    "<p>Core Concept: Michaelis-Menten kinetics: $k_{cat}$ and $v_{max}$ describe enzyme rate.\nA second line of real content follows.</p>";
  const out = formatExplanation(raw);
  assert.doesNotMatch(out.concept, /<em>/);
  assert.match(out.concept, /\$k_\{cat\}\$ and \$v_\{max\}\$/);
});

test("AUDIT: decimal numbers at the start of a line are not mistaken for a numbered list marker", () => {
  const raw = "<p>Detailed Explanation:\nNormal range is 3.5 to 5.0 mg/dL.\n1.5 mmol is the clinical threshold.</p>";
  const out = formatExplanation(raw);
  assert.doesNotMatch(out.body, /<ol>|<li>/);
  assert.match(out.body, /3\.5 to 5\.0 mg\/dL/);
  assert.match(out.body, /1\.5 mmol is the clinical threshold/);
});

test("AUDIT: a real numbered list of steps is still recognised (positive control for the test above)", () => {
  const raw = "<p>Detailed Explanation:\n1. UVB exposure\n2. Pre-vitamin D3 forms\n3. Liver and kidney activate it</p>";
  const out = formatExplanation(raw);
  assert.match(out.body, /<ol><li>UVB exposure<\/li><li>Pre-vitamin D3 forms<\/li><li>Liver and kidney activate it<\/li><\/ol>/);
});

test("AUDIT: a label appearing mid-paragraph (not at the very start of a block) is left unsplit rather than guessed at", () => {
  // "Core Concept:" here is genuinely mid-sentence, not a section boundary
  // — safer to leave the whole thing as one body paragraph than to guess
  // where the real split should be.
  const raw = "<p>This finding is classic. Core Concept: vitamin D synthesis begins in skin.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.hasStructure, false);
  assert.equal(out.concept, "");
  assert.match(out.body, /This finding is classic\. Core Concept: vitamin D synthesis begins in skin\./);
});

test("AUDIT: a mix of already-real HTML and a still-unconverted escaped-markdown paragraph — only the raw one is reconstructed", () => {
  const raw =
    "<p>This paragraph is already real HTML with <strong>proper bold</strong>.</p>" +
    "<p>**This one still has raw markdown** because only the first paragraph was ever re-edited.</p>";
  const out = formatExplanation(raw);
  assert.match(out.body, /<p>This paragraph is already real HTML with <strong>proper bold<\/strong>\.<\/p>/);
  assert.match(out.body, /<strong>This one still has raw markdown<\/strong> because only the first paragraph/);
  assert.doesNotMatch(out.body, /\*\*/);
});

test("AUDIT: HTML entities (medical symbols, ampersands) are never altered or double-escaped", () => {
  const raw = "<p>Core Concept: A &amp; B receptors differ; normal range is &lt;5 &mu;g/dL.</p>";
  const out = formatExplanation(raw);
  assert.match(out.concept, /A &amp; B receptors differ; normal range is &lt;5 &mu;g\/dL\./);
});

test("AUDIT: a long, multi-sentence option explanation is preserved in full, not truncated", () => {
  const longReason =
    "This is incorrect because the described mechanism relies on covalent modification of the enzyme's active site, " +
    "which has never been demonstrated for this particular pathway in vivo, and the kinetic data instead support a " +
    "purely allosteric, non-covalent model of regulation consistent with the original 1965 Monod-Wyman-Changeux proposal.";
  const raw = `<p>Why Other Options Are Wrong: B) Covalent modification: Incorrect - ${longReason}</p>`;
  const out = formatExplanation(raw, [{ letter: "B", text: "Covalent modification" }]);
  assert.equal(out.optionAnalysisByLetter.B.text, longReason);
});

test("AUDIT: an explanation with only Correct Answer + a plain sentence renders just that sentence — no invented sections", () => {
  const raw = "<p>Correct Answer: A) Skin</p><p>Vitamin D synthesis begins in the skin.</p>";
  const out = formatExplanation(raw);
  assert.equal(out.concept, "");
  assert.equal(out.optionAnalysisByLetter, null);
  assert.equal(out.takeaway, "");
  assert.equal(out.body, "<p>Vitamin D synthesis begins in the skin.</p>");
});

test("AUDIT: option-analysis-only explanation (no concept/body/takeaway) surfaces only that section", () => {
  const raw = "<p>Why Other Options Are Wrong: B) Ionic bonds: Incorrect - wrong mechanism entirely.</p>";
  const out = formatExplanation(raw, [{ letter: "B", text: "Ionic bonds" }]);
  assert.equal(out.concept, "");
  assert.equal(out.body, "");
  assert.equal(out.takeaway, "");
  assert.match(out.optionAnalysisByLetter.B.text, /wrong mechanism entirely/);
});

test("AUDIT: option text/letters are read from the caller's real option list, never invented from parsed prose", () => {
  // Even if the prose names an option differently or a letter has no real
  // counterpart, the parser only ever returns text keyed by letter — it
  // never fabricates an option object. Rendering the correct label/letter
  // is the caller's (ExplanationDisplay's) job using its own real options.
  const raw = "<p>Why Other Options Are Wrong: E) Some invented option: Incorrect - not real.</p>";
  const out = formatExplanation(raw, [{ letter: "A", text: "Real option" }]);
  // "E" is outside A-D, so the letter-marker regex (by design) never
  // matches it at all — the whole thing stays as unparsed overflow text,
  // never silently dropped.
  assert.equal(out.optionAnalysisByLetter, null);
  assert.match(out.optionAnalysisHtml, /Some invented option/);
});
