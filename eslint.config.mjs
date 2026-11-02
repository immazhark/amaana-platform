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
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/tabindex-no-positive": "error",
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
