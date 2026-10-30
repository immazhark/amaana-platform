import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const selectors = [
  ".menu-toggle:hover",
  ".mobile-menu-primary a:hover",
  ".mobile-menu-secondary a:hover",
  ".af-support-cta:is(:hover,:focus-visible)",
  ".site-header .nav-donate:is(:hover,:focus-visible)",
  ".amaana-live-cta:hover",
  ".amaana-companion-dock>button:hover",
  '.amaana-companion-dock>button[aria-expanded="true"]',
];

test.each(selectors)("Shared reduced-motion reset includes %s", selector => {
  const css = readFileSync(new URL("../app/site-chrome.css", import.meta.url), "utf8");
  const reduced = css.slice(css.lastIndexOf("/* Shared controls"));
  expect(reduced).toContain("@media(prefers-reduced-motion:reduce)");
  expect(reduced).toContain(selector);
  expect(reduced).toContain("transform:none");
});
