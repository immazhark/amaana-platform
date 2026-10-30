import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const routeDirectory = fileURLToPath(new URL(".", import.meta.url));
const componentDirectory = fileURLToPath(new URL("../../components/", import.meta.url));

function pageSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageSources(path);
    if (!/\.(tsx|jsx)$/.test(entry.name) || /\.(test|spec)\./.test(entry.name)) return [];
    return [readFileSync(path, "utf8")];
  });
}

test("Our Work does not load CSS with no consuming page or component class", () => {
  const layout = readFileSync(join(routeDirectory, "layout.tsx"), "utf8");
  const renderedSource = [...pageSources(routeDirectory), ...pageSources(componentDirectory)].join("\n");
  const stylesheets = [...layout.matchAll(/import\s+["'](\.\.\/[^"']+\.css)["']/g)];

  expect(stylesheets.length).toBeGreaterThan(0);
  for (const match of stylesheets) {
    const importPath = match[1];
    if (!importPath) throw new Error("Invalid stylesheet import");
    const stylesheet = readFileSync(resolve(routeDirectory, importPath), "utf8");
    const classNames = [...stylesheet.matchAll(/\.([a-z][a-z0-9-]*)/gi)].flatMap((match) => match[1] ? [match[1]] : []);
    expect(classNames.length).toBeGreaterThan(0);
    expect(classNames.some((name) => renderedSource.includes(name)), `${importPath} has no consuming class`).toBe(true);
  }
});
