import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cases = [
  ["../app/stories/page.tsx", "leadStoryMedia", "(max-width: 700px) 100vw, 48vw"],
  ["../app/stories/page.tsx", "identity", "(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 42vw"],
  ["../app/faith-and-reflections/page.tsx", "leadMedia", "(max-width: 700px) 100vw, 48vw"],
  ["../app/faith-and-reflections/[slug]/page.tsx", "asset", "(max-width: 700px) 100vw, (max-width: 1100px) 48vw, 33vw"],
  ["../app/stories/[slug]/page.tsx", "asset", "(max-width: 700px) 86vw, (max-width: 1200px) 45vw, 30vw"],
] as const;
describe("supporting media has sizes matched to real layout slots", () => {
  it.each(cases)("%s uses a bounded responsive width for %s", (route, asset, sizes) => {
    const source = readFileSync(new URL(route, import.meta.url), "utf8");
    expect(source).toContain(`asset={${asset}}`);
    expect(source).toContain(`sizes="${sizes}"`);
  });
});
