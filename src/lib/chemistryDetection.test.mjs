/**
 * Content-rendering fix (2026-09-28) — regression suite for
 * isLegacyChemicalFormula, the conservative detector that lets a standalone
 * legacy chemical formula written as ordinary math ("H_2SO_4") render with
 * chemistry typography (upright element symbols, via mhchem) instead of
 * KaTeX's default math-mode italics — see chemistryDetection.js's own
 * docstring for exactly why this must never become a general "subscript
 * means chemistry" heuristic.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { isLegacyChemicalFormula } from "./chemistryDetection.js";

test("recognises every required legacy chemical formula", async (t) => {
  const formulas = ["H_2O", "CO_2", "H_2SO_4", "HNO_3", "NO_2^+", "KMnO_4", "NH_3", "CaCO_3", "NaHCO_3", "CH_3COOH"];
  for (const formula of formulas) {
    await t.test(formula, () => {
      assert.equal(isLegacyChemicalFormula(formula), true, `${formula} must be recognised as chemistry`);
    });
  }
});

test("never mistakes genuine mathematics for chemistry", async (t) => {
  const mathExpressions = [
    "K_a", "E_k", "x_2", "a_n", "T_1", "v_2", "P_2/P_1", "10^{-3}", "\\Delta H", "\\frac{a}{b}",
  ];
  for (const expr of mathExpressions) {
    await t.test(expr, () => {
      assert.equal(isLegacyChemicalFormula(expr), false, `${expr} must stay ordinary mathematics`);
    });
  }
});

test("edge cases around the '2+ groups OR 1 group with subscript/charge' rule", async (t) => {
  await t.test("a single bare element with no subscript is NOT chemistry (indistinguishable from a math variable)", () => {
    assert.equal(isLegacyChemicalFormula("H"), false);
    assert.equal(isLegacyChemicalFormula("N"), false);
    assert.equal(isLegacyChemicalFormula("K"), false);
  });

  await t.test("a single element WITH a numeric subscript is chemistry (O_2, H_2)", () => {
    assert.equal(isLegacyChemicalFormula("O_2"), true);
    assert.equal(isLegacyChemicalFormula("H_2"), true);
  });

  await t.test("a single element with only a charge is chemistry (Na^+, Cl^-)", () => {
    assert.equal(isLegacyChemicalFormula("Na^+"), true);
    assert.equal(isLegacyChemicalFormula("Cl^-"), true);
  });

  await t.test("two bare elements with no subscripts at all is still chemistry (NaCl-shaped)", () => {
    assert.equal(isLegacyChemicalFormula("NaCl"), true);
  });
});

test("rejects anything containing a non-chemistry token, even alongside a valid-looking formula", async (t) => {
  const rejected = [
    "H_2O + energy", // extra prose
    "H_2O = ice", // equals sign
    "H_2O/CO_2", // division between two formulas
    "\\text{H_2O}", // wrapped in an unrelated command
    "2H_2O", // a leading bare coefficient — not part of this conservative detector's scope
    "H_2O_", // trailing dangling underscore
    "", // empty
    "   ", // whitespace only
  ];
  for (const expr of rejected) {
    await t.test(JSON.stringify(expr), () => {
      assert.equal(isLegacyChemicalFormula(expr), false);
    });
  }
});

test("rejects non-allowlisted letters that happen to look element-like", async (t) => {
  // "U" (Uranium), "W" (Tungsten) etc. are real elements but deliberately
  // excluded from the allowlist — see chemistryDetection.js's own
  // docstring for why (far more common as math variables in this app's
  // actual content than as chemistry).
  assert.equal(isLegacyChemicalFormula("U_235"), false);
  assert.equal(isLegacyChemicalFormula("W_2"), false);
});

test("null/undefined/non-string input never throws", () => {
  assert.equal(isLegacyChemicalFormula(null), false);
  assert.equal(isLegacyChemicalFormula(undefined), false);
  assert.equal(isLegacyChemicalFormula(123), false);
});
