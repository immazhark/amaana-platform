import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppealCard } from "./appeal-card";

vi.mock("@/components/work-visual-placeholder", () => ({ WorkVisualPlaceholder: () => null }));

const css = readFileSync(resolve(process.cwd(), "src/app/appeal-card.css"), "utf8");
const selectors = [
  ".v2-appeal-card-head small",
  ".v2-appeal-progress-meta span",
  ".v2-appeal-progress-foot",
];

function cssProperty(selector: string, property: "background" | "color") {
  const escapedSelector = selector.replaceAll(".", "\\.");
  const rule = css.match(new RegExp(`${escapedSelector}\\{([^}]*)\\}`))?.[1];
  expect(rule, `missing live CSS rule ${selector}`).toBeDefined();
  const declaration = rule?.match(new RegExp(`(?:^|;)${property}:\\s*(#[0-9a-fA-F]{6})(?:;|$)`))?.[1];
  expect(declaration, `missing literal ${property} color for ${selector}`).toBeDefined();
  return declaration!;
}

function luminance(hex: string) {
  const linearChannel = (index: number) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearChannel(1) + 0.7152 * linearChannel(3) + 0.0722 * linearChannel(5);
}

function contrast(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe("AF-R019 public appeal-card muted text contrast", () => {
  it("renders synthetic location, funding summary, and progress foot on the shared card", () => {
    const html = renderToStaticMarkup(<AppealCard appeal={{
      slug: "synthetic-contrast-card",
      title: "Synthetic appeal",
      summary: "Test-only summary",
      category: "EDUCATION",
      beneficiaryLocation: null,
      goalAmount: 1000,
      amountRaised: 250,
    }} />);

    expect(html).toContain("v2-appeal-card-head");
    expect(html).toContain("Location withheld");
    expect(html).toContain("v2-appeal-progress-meta");
    expect(html).toContain("25% supported");
    expect(html).toContain("Verified appeal");
  });

  // This checks declared fallback tokens only. The Playwright contract checks
  // effective contrast after the shared cascade and translucent/gradient layers.
  it.each(selectors)("%s has at least 4.5:1 contrast against its cream fallback", selector => {
    const background = cssProperty(".v2-appeal-card", "background");
    expect(background).toBe("#fffdf8");
    const foreground = cssProperty(selector, "color");
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
