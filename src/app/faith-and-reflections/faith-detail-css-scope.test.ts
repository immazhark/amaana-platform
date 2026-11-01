import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const sharedLayout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const detailPage = readFileSync(new URL("./[slug]/page.tsx", import.meta.url), "utf8");
const sharedCss = readFileSync(new URL("../faith-wow.css", import.meta.url), "utf8");
const detailCss = readFileSync(new URL("../faith-detail.css", import.meta.url), "utf8");

test("Faith detail-only CSS belongs to the article page, not the library layout", () => {
  expect(sharedLayout).not.toContain('import "../faith-detail.css"');
  expect(detailPage).toContain('import "../../faith-detail.css"');
  expect(detailCss).toContain(".v2-faith-detail-body-grid");
  expect(detailPage).toContain("v2-faith-detail-body-grid");
});

test("Faith library card styling and keyboard focus remain shared by both routes", () => {
  const sharedRules = [
    ".v2-faith-library-item{color:inherit;text-decoration:none}",
    ".v2-faith-library-action{display:block;margin-top:auto;padding-top:1.5rem;color:var(--v2-gold);font-size:.76rem;letter-spacing:.03em}",
    ".v2-faith-library-item:focus-visible{outline:3px solid var(--v2-gold);outline-offset:4px}",
  ];
  for (const rule of sharedRules) expect(sharedCss).toContain(rule);
  expect(detailCss).not.toContain(".v2-faith-library-");
});
