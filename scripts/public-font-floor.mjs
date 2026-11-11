import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_FONT_PX = 12;
const MIN_FONT_REM = 0.75;

// This checks literal px/rem bounds, including values inside CSS functions.
// It does not replace computed-style and zoom acceptance in a browser.
export function auditFontSizes(source, path) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = /(?:^|[;{}])\s*(font-size|font)\s*:\s*([^;{}]+)/gi;
  const violations = [];

  for (const match of css.matchAll(declarations)) {
    const shorthand = match[1].toLowerCase() === "font";
    const value = match[2].trim().replace(/\s*!important\s*$/i, "");
    if (value === "0") continue; // Icon-only controls may hide their text glyph.

    // A clamp's first argument is the lower bound. Its middle calc() may
    // legitimately subtract a small length without reducing that bound.
    const clampFloor = !shorthand && /^clamp\(\s*(-?\d*\.?\d+)\s*(rem|px)\s*,/i.exec(value);
    // Fold only standalone constant calc products/quotients in font-size.
    // Operand-only scanning misses calc(1rem * .5), while it rejects
    // calc(11px * 2) despite the computed size being above the floor.
    // Mixed-unit, nested and dynamic expressions keep the existing audit.
    const directCalc = !shorthand && /^calc\(\s*(-?\d*\.?\d+)\s*(rem|px)\s*([*/])\s*(-?\d*\.?\d+)\s*\)$/i.exec(value);
    const reverseCalc = !shorthand && /^calc\(\s*(-?\d*\.?\d+)\s*\*\s*(-?\d*\.?\d+)\s*(rem|px)\s*\)$/i.exec(value);
    const computed = directCalc
      ? (directCalc[3] === "*" ? Number(directCalc[1]) * Number(directCalc[4])
        : Number(directCalc[1]) / Number(directCalc[4]))
      : reverseCalc ? Number(reverseCalc[1]) * Number(reverseCalc[2]) : null;
    if (computed !== null && !Number.isFinite(computed)) {
      violations.push({ path, value });
      continue;
    }
    const computedUnit = directCalc?.[2] ?? reverseCalc?.[3];
    const folded = computed !== null && computedUnit
      ? [[value, String(computed), computedUnit]]
      : null;
    const measurements = folded
      ? folded
      : clampFloor ? [clampFloor]
      : [...value.matchAll(/(?:^|[^\w.])(-?\d*\.?\d+)\s*(rem|px)\b/gi)];
    // A font shorthand contains a size followed by an optional /line-height.
    // Check its first literal px/rem size only; a smaller line-height is not
    // evidence of a sub-12px font. System-font keywords have no literal size.
    const sizesToCheck = shorthand ? measurements.slice(0, 1) : measurements;
    const tooSmall = sizesToCheck.some(([, number, unit]) => {
      const minimum = unit.toLowerCase() === "px" ? MIN_FONT_PX : MIN_FONT_REM;
      return Number(number) < minimum;
    });

    if (tooSmall) violations.push({ path, value });
  }

  return violations;
}

async function* cssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* cssFiles(path);
    else if (entry.isFile() && path.endsWith(".css")) yield path;
  }
}

export async function auditPublicStyles(root = process.cwd()) {
  const violations = [];
  for await (const path of cssFiles(join(root, "src"))) {
    const displayPath = relative(root, path).split(sep).join("/");
    violations.push(...auditFontSizes(await readFile(path, "utf8"), displayPath));
  }
  return violations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = await auditPublicStyles();
  for (const issue of violations) {
    console.error(`${issue.path}: font-size ${issue.value} falls below the 12px literal floor`);
  }
  if (violations.length) process.exitCode = 1;
  else console.log("Public CSS font-size literal floor: PASS");
}
