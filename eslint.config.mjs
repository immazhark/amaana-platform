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
  // The generated vendor module is checked by regeneration and schema parity tests.
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "src/generated/curated-gallery-contract.js"]),
]);

export default eslintConfig;
