import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("policy section numbering remains readable on pale paper", () => {
  const css = readFileSync(new URL("../app/policy-experience.css", import.meta.url), "utf8");
  it("uses dark gold ink on near-white policy sections rather than decorative gold", () => {
    expect(css).toContain(".v2-policy-sections article>span{padding-top:.35rem;color:var(--af-color-gold-ink)");
    expect(css).not.toContain(".v2-policy-sections article>span{padding-top:.35rem;color:var(--v2-gold)");
    expect(css).toContain(".v2-policy-principles span{color:var(--af-color-gold-ink)");
  });
  it("preserves intentionally light gold on dark error and not-found heroes", () => {
    expect(css).toContain(".v2-not-found h1 em,.v2-error-page h1 em{color:var(--v2-gold-soft)");
  });
});
