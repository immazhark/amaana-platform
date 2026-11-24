import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("homepage no-open-appeals recovery", () => {
  it("provides an actual Contact destination when asking about recurring initiatives", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    const start = source.indexOf("<h3>No Public Appeal Is Open Right Now</h3>");
    const end = source.indexOf("</section>", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const emptyState = source.slice(start, end);
    expect(emptyState).toContain("ask about Amaana’s recurring initiatives");
    expect(emptyState).toMatch(/<Link\s+[^>]*href="\/contact"[^>]*>/);
    expect(emptyState).toContain('href="/our-work"');
  });
});
