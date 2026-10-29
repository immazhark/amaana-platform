import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync(new URL("../app/donate-wow.css", import.meta.url), "utf8");
const reduced = css.slice(css.lastIndexOf("@media(prefers-reduced-motion:reduce)"));

test("Donation guide reduced motion prevents hover padding shift on desktop", () => {
  expect(css).toContain(".v2-donate-guide-list article:hover{padding-left:.7rem");
  expect(reduced).toMatch(/\.v2-donate-guide-list article:hover\{padding-left:0;?\}/);
});

test("Donation Back link reduced reset matches hover and keyboard focus specificity", () => {
  expect(css).toContain(".v2-donate-back:is(:hover,:focus-visible){color:var(--amaana-gold-soft);transform:translateX(-.2rem)}");
  expect(reduced).toMatch(/\.v2-donate-back:is\(:hover,:focus-visible\)\{transform:none;?\}/);
});
