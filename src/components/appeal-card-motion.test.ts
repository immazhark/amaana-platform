import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("AppealCard reduced-motion hover reset wins over later shared motion rules", () => {
  const css = readFileSync(new URL("../app/appeal-card.css", import.meta.url), "utf8");
  const normalHover = css.lastIndexOf(".v2-appeal-card:is(:hover,:focus-within){transform:");
  const reducedStart = css.lastIndexOf("@media(prefers-reduced-motion:reduce)");
  const finalReducedRule = css.slice(reducedStart);

  expect(normalHover).toBeGreaterThan(0);
  expect(reducedStart).toBeGreaterThan(normalHover);
  expect(finalReducedRule).toMatch(/main \.v2-appeal-card:is\(:hover,\s*:focus-within\)/);
  expect(finalReducedRule).toMatch(/main \.v2-appeal-card:hover \.v2-appeal-card-link strong/);
  expect(finalReducedRule).toMatch(/\{\s*transition:\s*none;\s*transform:\s*none;?\s*\}/);
});
