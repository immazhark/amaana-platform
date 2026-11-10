import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("delayed checkout initialization frame", () => {
  it.each(["loading", "ready", "opening", "verifying", "reconciliation"])("preserves the %s lifecycle", phase => {
    const source = readFileSync(new URL("./donation-form.tsx", import.meta.url), "utf8");
    const mount = source.match(/const frame = window\.requestAnimationFrame\([\s\S]*?return \(\) => window\.cancelAnimationFrame\(frame\)/)?.[0];
    expect(mount).toBeDefined();
    const expression = mount?.match(/setPhase\((current => [^;]+)\);/)?.[1];
    expect(expression).toBeDefined();
    const update = new Function(`return (${expression});`)() as (value: string) => string;
    expect(update(phase)).toBe(phase === "loading" ? "ready" : phase);
  });
});
