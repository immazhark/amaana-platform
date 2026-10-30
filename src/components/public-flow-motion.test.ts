import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("Assistance follow-up steps reset the hover transform under reduced motion", () => {
  const css = readFileSync(new URL("../app/assistance-wow.css", import.meta.url), "utf8");
  const reduced = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
  expect(css).toContain(".v2-assistance-after-flow>div:hover{background:rgb(255 253 248/45%);transform:translateY(-.2rem)}");
  expect(reduced).toContain(".v2-assistance-after-flow>div:hover{transform:none}");
});

test("Shared carousel controls reset enabled hover movement under reduced motion", () => {
  const css = readFileSync(new URL("./scroll-carousel.module.css", import.meta.url), "utf8");
  const reduced = css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
  expect(css).toContain(".controls button:hover:not(:disabled){transform:translateY(-1px)");
  expect(reduced).toContain(".controls button:hover:not(:disabled){transform:none}");
  expect(css).toContain(".controls button:focus-visible,.viewport:focus-visible{outline:3px solid var(--af-color-focus)");
  expect(css).toContain(".controls button:disabled{cursor:not-allowed;opacity:.36;box-shadow:none}");
});
