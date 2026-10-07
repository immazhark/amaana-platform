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
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
]);

export default eslintConfig;
