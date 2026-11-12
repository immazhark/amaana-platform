import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R024 Team typography source boundary", () => {
  it("keeps route CSS in a stylesheet inspected by the public font-floor audit", () => {
    const page = readFileSync(join(process.cwd(), "src/app/team/page.tsx"), "utf8");
    expect(page).toContain('import "./team.css";');
    expect(page).not.toMatch(/<style(?:\s|>)/);
    const styles = readFileSync(join(process.cwd(), "src/app/team/team.css"), "utf8");
    expect(styles).toContain(".team-page{");
    expect(styles).toContain(".team-member h3{");
    expect(styles).toContain("@media(prefers-reduced-motion:reduce)");
  });
});
