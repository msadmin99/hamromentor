#!/usr/bin/env node
/**
 * READ-ONLY dry-run audit of inline math spans against the shared classifier
 * (src/lib/trivialMath.js). Modifies nothing — it only reads a JSONL export
 * and prints a Markdown report.
 *
 * Input: JSON lines, one per question/option:
 *   {"k":"q","text":"...","expl":"..."}   or   {"k":"o","text":"..."}
 * Usage: node scripts/audit-math-spans.mjs questions.jsonl > report.md
 */
import fs from "node:fs";
import { classifyMathSpan } from "../src/lib/trivialMath.js";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/audit-math-spans.mjs <fields.jsonl>");
  process.exit(1);
}
const DISPLAY = [/\$\$([\s\S]+?)\$\$/g, /\\\[([\s\S]+?)\\\]/g];
const INLINE = [/\\\(([\s\S]+?)\\\)/g, /\$([^$\n]+?)\$/g];

const groups = new Map(); // "state/kind" -> { n, ex: Map }
let fields = 0, fieldsWithInline = 0, inline = 0, displaySpans = 0;
const bump = (key, sample) => {
  const g = groups.get(key) || { n: 0, ex: new Map() };
  g.n += 1;
  g.ex.set(sample, (g.ex.get(sample) || 0) + 1);
  groups.set(key, g);
};

function bucket(expr, c) {
  const flat = expr.replace(/\\[ ,;:!]/g, " ").trim();
  if (c.state === "plain") {
    if (c.kind === "text-group") {
      return /\s/.test(c.text.trim()) && /[a-z]{3,}/.test(c.text) ? "PLAIN  \\text{} English phrase" : "PLAIN  \\text{} chemical / abbreviation name";
    }
    return {
      number: "PLAIN  pure number", "number-list": "PLAIN  number list (with and/or/to)", percent: "PLAIN  percentage",
      degree: "PLAIN  degree quantity", ratio: "PLAIN  numeric ratio", "number-unit": "PLAIN  number + unit",
      "number-text": "PLAIN  number + \\text{...}",
    }[c.kind] || "PLAIN  other";
  }
  if (c.state === "ambiguous") {
    if (/^[A-Z][a-z]+(\s[a-z]+)?$/.test(flat) && /\\ /.test(expr)) return "AMBIGUOUS  binomial-style name (Genus species)";
    return "AMBIGUOUS  letters-only word(s)";
  }
  if (/\\(textit|mathit|emph)\b/.test(expr)) return "MATH  explicit italic command (\\textit ...)";
  if (/\\mathrm\b/.test(expr)) return "MATH  \\mathrm";
  if (/[_^]/.test(expr) && /\\text|[A-Z][a-z]?/.test(expr) && !/=/.test(expr)) return "MATH  formula / sub-superscript (chemical, powers)";
  if (/^[A-Za-z]{1,4}$/.test(flat)) return "MATH  short variable / abbreviation (P, n, AB, Rr)";
  if (/\\(frac|sqrt|sum|int|times|cdot|alpha|beta|gamma|pm|leq|geq)|=|[<>]/.test(expr)) return "MATH  expression / equation";
  if (/^-?\d/.test(flat) || /\d[A-Za-z]/.test(flat)) return "MATH  number-led (negative, 5x, 2n, 3d, ranges)";
  return "MATH  other";
}

for (const line of fs.readFileSync(file, "utf8").split("\n").filter(Boolean)) {
  const r = JSON.parse(line);
  for (let s of r.k === "q" ? [r.text, r.expl] : [r.text]) {
    if (!s) continue;
    fields += 1;
    for (const re of DISPLAY) s = s.replace(re, () => { displaySpans += 1; return " "; });
    let had = false;
    for (const re of INLINE) {
      s = s.replace(re, (m, expr) => {
        had = true; inline += 1;
        const e = expr.trim();
        const c = classifyMathSpan(e);
        bump(bucket(e, c), e.length > 46 ? `${e.slice(0, 46)}…` : e + (c.state === "plain" ? `  →  ${c.text}` : ""));
        return " ";
      });
    }
    if (had) fieldsWithInline += 1;
  }
}

const rows = [...groups.entries()].sort((a, b) => b[1].n - a[1].n);
const sum = (p) => rows.filter(([k]) => k.startsWith(p)).reduce((t, [, g]) => t + g.n, 0);
const pct = (n) => `${((100 * n) / inline).toFixed(1)}%`;
const SAFETY = {
  "PLAIN  pure number": "safe — a bare number has no math semantics",
  "PLAIN  number list (with and/or/to)": "safe",
  "PLAIN  percentage": "safe",
  "PLAIN  degree quantity": "safe — becomes the Unicode degree sign",
  "PLAIN  numeric ratio": "safe",
  "PLAIN  number + unit": "safe — unit must directly follow a number",
  "PLAIN  number + \\text{...}": "safe — author wrapped the text part explicitly",
  "PLAIN  \\text{} chemical / abbreviation name": "safe — explicit \\text (upright roman) already; no sub/superscripts",
  "PLAIN  \\text{} English phrase": "safe — explicit \\text",
  "AMBIGUOUS  letters-only word(s)": "NOT safe to clean automatically — could be prose or a product of variables; kept as KaTeX",
  "AMBIGUOUS  binomial-style name (Genus species)": "NOT safe — italics come from math mode; cleanup would need <em>; kept as KaTeX",
};
console.log(`# Inline math span dry-run (read-only)\n`);
console.log(`Fields scanned: ${fields}; fields with inline math: ${fieldsWithInline}; inline spans: ${inline}; display spans (never touched): ${displaySpans}\n`);
console.log(`| State | Spans | Share |\n|---|---:|---:|`);
for (const p of ["PLAIN", "AMBIGUOUS", "MATH"]) console.log(`| ${p} | ${sum(p)} | ${pct(sum(p))} |`);
console.log(`\n## By category (examples: before → after)\n`);
for (const [k, g] of rows) {
  const ex = [...g.ex.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `\`${e.replace(/\|/g, "\\|")}\`×${n}`).join(", ");
  console.log(`- **${k}** — ${g.n} spans (${g.ex.size} distinct). ${SAFETY[k] ? `Cleanup: ${SAFETY[k]}.` : "Kept as KaTeX."}\n  - ${ex}`);
}
