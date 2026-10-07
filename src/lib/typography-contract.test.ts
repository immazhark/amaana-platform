import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const roots = ["src/app", "src/components"];
const allowedGeorgiaFiles = new Set(["src/app/fonts.ts"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:css|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("canonical Amaana typography", () => {
  it("routes live display typography through the next/font token", () => {
    const offenders = roots
      .flatMap(sourceFiles)
      .map(path => path.replaceAll("\\", "/"))
      .filter(path => !allowedGeorgiaFiles.has(path))
      .flatMap(path => {
        const content = readFileSync(path, "utf8");
        const directGeorgia =
          /font-family\s*:\s*Georgia\b/i.test(content) ||
          /font\s*:[^;{}]*\bGeorgia\b/i.test(content) ||
          /fontFamily\s*:\s*["'`]Georgia\b/i.test(content);
        return directGeorgia ? [relative(process.cwd(), path).replaceAll("\\", "/")] : [];
      });

    expect(offenders).toEqual([]);
  });

  it("keeps the canonical display token bound to the next/font variable", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const globalError = readFileSync("src/app/global-error.tsx", "utf8");

    expect(globals).toContain("--af-font-display: var(--font-amaana-display), serif;");
    expect(globalError).toContain("amaanaDisplayFont.variable");
    expect(globalError).toContain('fontFamily: "var(--font-amaana-display), serif"');
  });
});
