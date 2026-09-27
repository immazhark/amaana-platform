import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const companion = readFileSync("src/app/islamic-companion.css", "utf8");
const finish = readFileSync("src/app/experience-finish.css", "utf8");
const iterationFour = readFileSync("src/app/iteration-four.css", "utf8");

describe("shared responsive layout regressions", () => {
  it("locks companion launchers to a compact bottom-right floating dock", () => {
    const companionRule = companion.match(/\.amaana-companion\s*\{([^}]+)\}/);
    const dockRules = [...companion.matchAll(/\.amaana-companion-dock\s*\{([^}]+)\}/g)];

    expect(companionRule).not.toBeNull();
    expect(companionRule![1]).toMatch(/position:\s*fixed/);
    expect(companionRule![1]).toMatch(/right:\s*max\(/);
    expect(companionRule![1]).toMatch(/bottom:\s*max\(/);

    expect(dockRules.length).toBeGreaterThan(0);
    expect(dockRules[0][1]).toMatch(/flex-wrap:\s*nowrap/);
    expect(companion).toMatch(/@media\s*\(max-width:\s*640px\)[\s\S]*\.amaana-companion-dock\s*\{[^}]*flex-direction:\s*column/);
    expect(companion).toMatch(/\.amaana-companion-dock\s*>\s*button\s*\{[^}]*max-width:\s*9rem/);
    expect(companion).not.toMatch(/Keep the launchers in flow/i);
    expect(iterationFour).not.toMatch(/\.amaana-companion\s*\{[^}]*position:\s*fixed/);
  });

  it("does not override the desktop menu visibility in the finish layer", () => {
    const baseRule = finish.match(/\.menu-toggle\{([^}]+)\}/);
    expect(baseRule).not.toBeNull();
    expect(baseRule![1]).not.toMatch(/display:/);
    expect(finish).toContain("@media(max-width:1020px){.site-header .nav-links{display:none}.site-header .menu-toggle{display:grid}");
  });

  it("keeps mobile reminder controls at least 44px high", () => {
    const rules = [...companion.matchAll(/\.amaana-reminder-controls button\s*\{([^}]+)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule[1]).toMatch(/min-height:\s*44px/);
  });
});

