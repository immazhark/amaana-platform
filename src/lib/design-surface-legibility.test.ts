import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = {
  stories: readFileSync(new URL("../app/stories.css", import.meta.url), "utf8"),
  governance: readFileSync(new URL("../app/governance.css", import.meta.url), "utf8"),
  policy: readFileSync(new URL("../app/policy-experience.css", import.meta.url), "utf8"),
  canonical: readFileSync(new URL("../app/canonical-content.css", import.meta.url), "utf8"),
  impact: readFileSync(new URL("../app/impact/impact-refinement.module.css", import.meta.url), "utf8"),
  initiative: readFileSync(new URL("../app/initiative-experience.css", import.meta.url), "utf8"),
  programme: readFileSync(new URL("../app/our-work/[slug]/campaign.css", import.meta.url), "utf8"),
  tokens: readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"),
  companion: readFileSync(new URL("../app/islamic-companion.css", import.meta.url), "utf8"),
};
function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map(offset => {
    const n = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
}
function token(name: string) {
  const match = css.tokens.match(new RegExp(`--${name}:\\s*(#[a-fA-F0-9]{6})\\s*;`));
  if (!match?.[1]) throw new Error(`Unknown colour token: ${name}`);
  return match[1];
}
describe("existing public typography and supporting-text contrast", () => {
  it.each(["af-color-label", "af-color-muted", "af-color-gold-ink"])(
    "maintains 4.5:1 or higher on the warm public canvas for %s", name => {
      expect(contrastRatio(token(name), token("af-color-canvas"))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(token(name), token("af-color-surface"))).toBeGreaterThanOrEqual(4.5);
    },
  );
  it("removes previously low-contrast governance and policy labels", () => {
    expect(css.governance).not.toMatch(/color:\s*#(?:8b7556|78818a)\b/i);
    expect(css.policy).not.toMatch(/color:\s*#8b7556\b/i);
    expect(css.governance).toContain("color:var(--af-color-label)");
    expect(css.policy).toContain("color:var(--af-color-label)");
    expect(css.initiative).not.toContain("color: #717a84");
    expect(css.initiative).not.toContain("color: #5f6974");
    expect(css.initiative).toContain("color: var(--af-color-muted)");
    expect(css.programme).toContain("color:var(--af-color-gold-ink)");

  });
  it("corrects low-contrast Companion captions and keeps 48px mobile dock targets", () => {
    expect(contrastRatio(token("af-color-gold-ink"), "#fffdf7")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(token("af-color-gold-ink"), "#fff9eb")).toBeGreaterThanOrEqual(4.5);
    expect(css.companion).not.toContain("color:#a57a08");
    expect(css.companion).not.toContain("color:#9a7207");
    expect(css.companion).toContain("width:3rem;");
    expect(css.companion).toContain("min-height:3rem;");
  });
  it("gives multiline headings room on Stories, Governance, Policy and canonical pages", () => {
    expect(css.stories).not.toContain("line-height:1.12");
    expect(css.canonical).not.toContain("line-height:1.12");
    expect(css.governance).not.toContain("line-height:.8");
    expect(css.governance).not.toContain("line-height:.94");
    expect(css.policy).not.toContain("line-height:1.04");
    expect(css.policy).toContain("line-height:1.22");
    expect(css.impact).not.toContain("line-height:1.08");
    expect(css.impact).toContain("line-height:1.22!important");
    // Large impact figures must remain legible when they wrap at 200% text.
    expect(css.impact).not.toContain("line-height:.88");
    expect(css.impact).toContain("line-height:1.12");
    expect(css.initiative).not.toContain("line-height: 1.05");
    expect(css.programme).not.toContain("line-height: 1.08");
    expect(css.programme).toContain("line-height: 1.2");

  });
});
