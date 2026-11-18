import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-cycle": ["error", { ignoreExternal: true }],
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/label-has-associated-control": ["error", { depth: 3 }],
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      // AF-R069: rules enabled after a codebase-wide probe found zero violations.
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/anchor-ambiguous-text": "error",
    },
  },
  // AF-R069: apply keyboard-focus enforcement to native-control share UI only.
  // Do not enable globally: existing roving-tablist components need separate review.
  {
    files: ["src/components/appeal-share.tsx"],
    rules: {
      "jsx-a11y/interactive-supports-focus": "error",
    },
  },
  {
    files: [
      "src/app/**/route.ts",
      "src/app/admin/(protected)/**/*.{ts,tsx}",
    ],
    rules: {
      "no-console": "error",
    },
  },
  // The generated vendor module is checked by regeneration and schema parity tests.
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "src/generated/curated-gallery-contract.js"]),
]);

export default eslintConfig;
