import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,

  // Accessibility pass: eslint-plugin-jsx-a11y is already registered by
  // eslint-config-next (so these rules cost no new dependency — the plugin
  // ships transitively), but core-web-vitals enables only a handful of its
  // checks. The rules below are the ones that caught real keyboard barriers
  // in the audit and are now clean, so they are enforced as errors to stop
  // the barriers coming back.
  {
    rules: {
      // Every clickable element must be reachable and operable by keyboard.
      // These two caught the modal/overlay backdrops, which were div-with-
      // onClick and had no keyboard path at all.
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      // Caught the notes dialog stealing focus from its own dialog panel.
      "jsx-a11y/no-autofocus": "error",
      // Cheap, always-correct structural checks.
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/iframe-has-title": "error",
    },
  },

  // Deliberately NOT enabled, with reasons — so the choice is a decision on
  // the record rather than an oversight:
  //
  // jsx-a11y/control-has-associated-label — 45 findings, and it is not in
  //   the plugin's own recommended set because it cannot see labels supplied
  //   through composition. Enabling it would bury the real findings.
  //
  // jsx-a11y/no-noninteractive-element-interactions — 1 remaining site,
  //   Sidebar's <aside onMouseEnter> hover-reveal, which already has a
  //   keyboard-accessible "Show sidebar" button as its equivalent path.
  //   Enforcing the rule would mean restructuring a working component for a
  //   barrier that does not exist.
  //
  // jsx-a11y/label-has-associated-control — 23 findings across forms. Real,
  //   but a larger remediation than this pass covers; tracked in
  //   docs/ACCESSIBILITY_AUDIT.md rather than silently enabled-and-ignored.

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
