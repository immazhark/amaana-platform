import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("AF-R072 keeps the public homepage metadata description concise and factual", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const description = source.match(/export const metadata: Metadata = \{[\s\S]*?\n  description: "([^"]+)",/)?.[1];
  expect(description, "homepage metadata description must be a reviewed string").toBeDefined();
  expect(description?.length).toBeLessThanOrEqual(160);
  expect(description).toContain("Amaana Foundation");
  expect(description).toContain("Hyderabad");
  expect(description).toContain("verified");
  expect(description).toContain("transparency");
});
