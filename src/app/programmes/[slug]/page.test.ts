import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("programme-category hero responsive media contract", () => {
  it("gives the priority local photo the same narrow layout sizes as the artwork", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
    const sizes = "(max-width: 900px) 90vw, 45vw";
    expect(source).toContain(`<ProgrammeArtwork slug={category.slug} sizes="${sizes}" />`);
    expect(source).toContain(`<PublicMedia asset={leadPhoto} priority sizes="${sizes}" />`);
  });
});
