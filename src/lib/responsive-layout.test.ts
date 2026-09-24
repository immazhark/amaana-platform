import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const companion = readFileSync("src/app/islamic-companion.css", "utf8");
const finish = readFileSync("src/app/experience-finish.css", "utf8");

describe("shared responsive layout regressions", () => {
  it("keeps persistent companion launchers in flow instead of over page content", () => {
    const rules = [...companion.matchAll(/\.amaana-companion-dock\s*\{([^}]+)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule[1]).not.toMatch(/position:\s*(fixed|absolute|sticky)/);
    expect(rules[0][1]).toMatch(/flex-wrap:\s*wrap/);
    expect(companion).not.toMatch(/body\s*\{\s*padding-bottom:\s*calc\(80px/);
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

