import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// AF-R024: no authored type rule may resolve below 12px (0.75rem at the 16px root).
const MIN_PX = 12;
const ROOT = new URL("../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(css|tsx|ts)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

function toPx(value, unit) {
  return unit === "px" ? value : value * 16;
}

// Returns every authored size that resolves below the floor, including the lower
// bound of clamp()/max()/min() and Tailwind arbitrary text-[..] utilities.
export function subMinimumSizes(source) {
  const found = [];
  const declaration = /font-size\s*:\s*([^;}]+)/g;
  for (const match of source.matchAll(declaration)) {
    const body = match[1];
    const wrapped = body.match(/^\s*(?:clamp|max|min)\(\s*([\d.]+)(px|rem)\b/);
    const plain = body.match(/^\s*([\d.]+)(px|rem)\b/);
    const first = wrapped ?? plain;
    if (first && toPx(Number(first[1]), first[2]) < MIN_PX) found.push(match[0].trim());
  }
  for (const match of source.matchAll(/\btext-\[([\d.]+)(px|rem)\]/g)) {
    if (toPx(Number(match[1]), match[2]) < MIN_PX) found.push(match[0]);
  }
  return found;
}

test("the scanner flags px, rem, clamp-floor and Tailwind arbitrary sizes below 12px", () => {
  assert.equal(subMinimumSizes("a{font-size:11px}").length, 1);
  assert.equal(subMinimumSizes("a{font-size:.7rem}").length, 1);
  assert.equal(subMinimumSizes("a{font-size:clamp(.6rem,1vw,1rem)}").length, 1);
  assert.equal(subMinimumSizes('<p className="text-[10px]">').length, 1);
});

test("the scanner accepts 12px and larger", () => {
  assert.deepEqual(subMinimumSizes("a{font-size:12px}b{font-size:.75rem}c{font-size:clamp(.75rem,1vw,1rem)}"), []);
  assert.deepEqual(subMinimumSizes('<p className="text-xs text-[12px]">'), []);
});

test("no authored stylesheet or component declares text below 12px", () => {
  assert.ok(files(ROOT).length > 100, "the scan must actually cover the source tree");
  const offenders = files(ROOT).flatMap((file) => subMinimumSizes(readFileSync(file, "utf8")).map((hit) => `${file}: ${hit}`));
  assert.deepEqual(offenders, []);
});
