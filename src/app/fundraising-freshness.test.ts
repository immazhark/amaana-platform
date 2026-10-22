import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Next.js page cache configuration is part of the public donation safety
 * contract. An ISR snapshot can outlive an appeal's closesAt or funded state
 * even if the data getter rechecks eligibility on a fresh render.
 */
describe("live fundraising index rendering", () => {
  it.each([
    ["homepage", "src/app/page.tsx"],
    ["appeals index", "src/app/appeals/page.tsx"],
  ])("renders the %s per request instead of serving a cached appeal snapshot", (_route, path) => {
    const pageSource = readFileSync(path, "utf8");
    expect(pageSource).toMatch(/export const dynamic\s*=\s*["']force-dynamic["']/);
    expect(pageSource).not.toMatch(/export const revalidate\s*=\s*300\b/);
  });
});
