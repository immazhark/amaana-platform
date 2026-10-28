import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");

function renderSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return renderSourceFiles(path);
    return entry.isFile() && /\.(?:jsx|tsx)$/.test(entry.name) && !/\.(?:spec|test)\./.test(entry.name)
      ? [path]
      : [];
  });
}

describe("transparency route CSS loading", () => {
  it("does not ship the obsolete folio stylesheet while no rendered component uses it", () => {
    const stylesheet = readFileSync(join(sourceRoot, "app/transparency/transparency-wow.css"), "utf8");
    const folioClasses = new Set(
      [...stylesheet.matchAll(/\.((?:v2-transparency-folio)(?:-[a-z-]+)?)/g)]
        .map((match) => match[1])
        .filter((className): className is string => typeof className === "string"),
    );
    expect(folioClasses.size).toBeGreaterThan(0);

    const renderFiles = [
      ...renderSourceFiles(join(sourceRoot, "app")),
      ...renderSourceFiles(join(sourceRoot, "components")),
    ];
    const classUsers = renderFiles.filter((file) => {
      const component = readFileSync(file, "utf8");
      return [...folioClasses].some((className) => component.includes(className));
    });
    expect(classUsers).toEqual([]);

    const layout = readFileSync(join(sourceRoot, "app/transparency/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/import\s+["']\.\/transparency-wow\.css["']/);
  });
});
