import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const css = readFileSync(new URL("../app/impact/impact-refinement.module.css", import.meta.url), "utf8");
const reduced = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
test.each([".v2-impact-tile-media img", ".v2-impact-tile-media video", ".v2-impact-tile-action"])("Impact reduced motion resets nested interaction: %s", target => {
  expect(reduced).toContain(`:global(.v2-impact-tile:is(:hover,:focus-visible) ${target})`);
  expect(reduced).toMatch(/\{transform:none\}/);
});
test("Impact retains normal media zoom, action translation and visible keyboard focus", () => {
  expect(css).toContain("transform:scale(1.055)");
  expect(css).toContain("transform:translateX(.2rem)");
  expect(css).toContain(":global(.v2-impact-tile:focus-visible){box-shadow:0 0 0 3px #fffdf8");
});
