import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("Faith library hover and keyboard focus do not lift under reduced motion", () => {
  const css = readFileSync(new URL("../faith-wow.css", import.meta.url), "utf8");
  const normalHover = css.indexOf(".v2-faith-library-item:is(:hover,:focus-visible){transform:translateY");
  const reducedStart = css.lastIndexOf("@media(prefers-reduced-motion:reduce)");

  expect(normalHover).toBeGreaterThan(0);
  expect(reducedStart).toBeGreaterThan(normalHover);
  expect(css.slice(reducedStart)).toMatch(
    /\.v2-faith-page \.v2-faith-library-item:is\(:hover,\s*:focus-visible\)\s*\{\s*transform:\s*none;\s*transition:\s*none;?\s*\}/,
  );
});
