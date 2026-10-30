import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const routeDirectory = fileURLToPath(new URL(".", import.meta.url));
const componentDirectory = fileURLToPath(new URL("../../components/", import.meta.url));

function renderedSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return renderedSources(path);
    if (!/\.(tsx|jsx)$/.test(entry.name) || /\.(test|spec)\./.test(entry.name)) return [];
    return [readFileSync(path, "utf8")];
  });
}

test("Appeals route CSS excludes selectors with no consuming page or component class", () => {
  const css = readFileSync(new URL("../appeals-wow.css", import.meta.url), "utf8");
  const source = [...renderedSources(routeDirectory), ...renderedSources(componentDirectory)].join("\n");
  const classNames = [...new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/gi)].flatMap((match) => match[1] ? [match[1]] : []))];
  const unused = classNames.filter((name) => !source.includes(name));

  expect(unused).toEqual([]);
  for (const match of css.matchAll(/@keyframes\s+([a-z][a-z0-9-]*)/gi)) {
    const animation = match[1];
    if (!animation) throw new Error("Invalid CSS keyframe name");
    expect(css).toMatch(new RegExp(`animation[^;}]*\\b${animation}\\b`));
  }
});
