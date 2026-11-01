import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("Stories reduced-motion reset covers feature and card interaction specificity", () => {
  const css = readFileSync(new URL("../app/stories-wow.css", import.meta.url), "utf8");
  const reduced = css.slice(css.lastIndexOf("@media(prefers-reduced-motion:reduce)"));
  expect(reduced).toMatch(/\.v2-stories-feature-media:is\(:hover,:focus-visible\),\.v2-stories-card:is\(:hover,:focus-visible\)\{transform:none;?\}/);
  expect(css).toContain(".v2-stories-card:is(:hover,:focus-visible){transform:translateY(-.45rem)");
});

test("Gallery reduced-motion reset removes hover zoom without removing normal motion", () => {
  const css = readFileSync(new URL("./campaign-media-gallery.module.css", import.meta.url), "utf8");
  const reduced = css.slice(css.lastIndexOf("@media(prefers-reduced-motion:reduce)"));
  expect(reduced).toContain(".trigger:hover img{transform:none}");
  expect(css).toContain(".trigger:hover img{transform:scale(1.025)}");
});

test("Stories reduced-motion photo reset wins over hover zoom and late transitions", () => {
  const css = readFileSync(new URL("../app/stories-wow.css", import.meta.url), "utf8");
  const reduced = css.slice(css.lastIndexOf("@media(prefers-reduced-motion:reduce)"));
  expect(reduced).toContain(".v2-stories-feature-media:is(:hover,:focus-visible) .v2-media-item img");
  expect(reduced).toContain(".v2-stories-card:is(:hover,:focus-visible) .v2-stories-card-media img");
  expect(reduced).toContain("{transform:none;transition:none}");
});
