import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: [
      "src/app/**/route.ts",
      "src/app/admin/(protected)/**/*.{ts,tsx}",
    ],
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Next supplies the import plugin and TS resolver; inspect our graph,
      // including dynamic imports, without traversing third-party packages.
      "import/no-cycle": ["error", { ignoreExternal: true }],
      // Supplement button/summary/role naming without misclassifying native
      // form controls associated with separate or wrapping labels.
      "jsx-a11y/control-has-associated-label": ["error", {
        ignoreElements: ["input", "select", "textarea"],
        depth: 5,
      }],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
]);

export default eslintConfig;
