/**
 * Conservative, deterministic detector for a LEGACY chemical formula
 * written as ordinary math (`H_2SO_4`, `NO_2^+`) rather than the proper
 * mhchem `\ce{...}` syntax (see RichContent.js's mhchem import for the
 * actual chemistry rendering, and mathDelimiters.js's applyDelimiters for
 * where this is called). Exists because a read-only production content
 * audit (2026-09-28) found hundreds of chemistry formulas already stored
 * this way — authored before `\ce{}` support existed — and re-authoring
 * that content is a separate, larger migration effort (see the
 * implementation report), not something this rendering fix performs.
 *
 * DELIBERATELY NOT a general "a subscript means chemistry" heuristic. The
 * same content fields are full of genuine mathematics using the exact
 * same subscript/superscript syntax — K_a, E_k, x_2, a_n, T_1, v_2,
 * P_2/P_1, 10^{-3} — and every one of those must keep rendering as
 * ordinary math. The rule this module enforces:
 *
 *   The ENTIRE trimmed expression must be composed of nothing but one or
 *   more (allowlisted periodic-table element symbol + optional PURELY
 *   NUMERIC subscript) groups, optionally followed by one trailing ionic-
 *   charge superscript — and nothing else at all: no operators, no
 *   fractions, no Greek letters, no non-element single-letter variables,
 *   no division/equals signs.
 *
 * A single bare element with no subscript and no companions ("H" alone,
 * "N" alone) is never treated as chemistry — indistinguishable from an
 * ordinary one-letter math variable, no positive signal either way, left
 * to existing math rendering. Only 2+ element groups in immediate
 * sequence, OR one group carrying an actual numeric subscript/charge
 * (H_2, O^2-), counts as unambiguous chemistry — this is exactly what
 * separates every "must render as chemistry" example above from every
 * "must stay math" example: a math variable in this content is always a
 * single symbol on its own, never immediately followed by another
 * capitalised element-like token with no operator between them.
 *
 * Deliberately does NOT handle parentheses (`Ca(OH)_2`, `Al_2(SO_4)_3`)
 * or non-numeric substructure — out of scope for this conservative
 * legacy-detection pass; that content should be authored with `\ce{}`
 * going forward, which already handles it correctly once matched.
 *
 * Dependency-free (no DOM, no katex) — unit-testable under `node --test`.
 */

// Every element symbol actually plausible in this app's UG/PG medical &
// allied-science question bank — deliberately NOT the full periodic
// table, to keep the allowlist auditable and avoid single-letter clashes
// with common math/physics variables that are never real chemistry in
// this content (no U, W, Y, V, R, L, M, ... — every one of those is a
// far more common math variable here than an element symbol).
const TWO_LETTER_ELEMENTS = [
  "He", "Li", "Be", "Ne", "Na", "Mg", "Al", "Si", "Cl", "Ar", "Ca", "Mn",
  "Fe", "Cu", "Zn", "Br", "Ag", "Ba", "Au", "Pb", "Hg",
];
const ONE_LETTER_ELEMENTS = ["H", "C", "N", "O", "F", "P", "S", "K", "I", "B"];

// Two-letter alternatives listed first so the engine never lets a two-
// letter symbol's first character steal a match that should have
// consumed both letters (e.g. "Ca" must match as one unit, not "C").
const ELEMENT_SRC = `(?:${TWO_LETTER_ELEMENTS.join("|")}|${ONE_LETTER_ELEMENTS.join("|")})`;
const SUBSCRIPT_SRC = `(?:_\\{?\\d+\\}?)?`;
const GROUP_SRC = `${ELEMENT_SRC}${SUBSCRIPT_SRC}`;
const CHARGE_SRC = `(?:\\^\\{?\\d*[+-]\\}?)?`;

const FORMULA_RE = new RegExp(`^(?:${GROUP_SRC})+${CHARGE_SRC}$`);
const GROUP_RE_GLOBAL = new RegExp(GROUP_SRC, "g");
const HAS_SUBSCRIPT_RE = /_\{?\d+\}?/;
const HAS_CHARGE_RE = /\^\{?\d*[+-]\}?$/;

export function isLegacyChemicalFormula(expr) {
  if (expr == null) return false;
  const trimmed = String(expr).trim();
  if (!trimmed) return false;
  if (!FORMULA_RE.test(trimmed)) return false;

  const groupMatches = trimmed.match(GROUP_RE_GLOBAL) || [];
  if (groupMatches.length >= 2) return true;
  if (groupMatches.length === 1) {
    return HAS_SUBSCRIPT_RE.test(trimmed) || HAS_CHARGE_RE.test(trimmed);
  }
  return false;
}
