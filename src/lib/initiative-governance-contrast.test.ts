import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const file = (name: string) => readFileSync(new URL(`../app/${name}`, import.meta.url), "utf8");
describe("light-paper gold labels keep high-contrast ink", () => {
  it("uses readable ink in governance people cards, not decorative gold", () => {
    const css = file("governance.css");
    expect(css).toContain(".v2-governance-people article>span{color:var(--af-color-gold-ink)");
    expect(css).not.toContain(".v2-governance-people article>span{color:var(--v2-gold)");
    // Gold on dark governance boundaries is intentionally unchanged.
    expect(css).toContain(".v2-governance-boundary-grid article>span{color:var(--v2-gold)");
  });
  it("keeps initiative gold-on-paper copy legible without recoloring dark evidence panels", () => {
    const css = file("initiative-experience.css");
    expect(css).toMatch(/\.v2-initiative-trust-note span\s*\{\s*color:\s*var\(--af-color-gold-ink\)/);
    expect(css).toMatch(/\.v2-initiative-faith-grid small\s*\{\s*color:\s*var\(--af-color-gold-ink\)/);
    expect(css).toMatch(/\.v2-initiative-evidence-panel strong\s*\{[^}]*line-height:\s*1\.08;/);
    expect(css).toMatch(/\.v2-initiative-evidence-panel strong\s*\{[^}]*color:\s*var\(--v2-gold\)/);
  });
});
