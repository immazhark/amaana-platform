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

const toPx = (value, unit) => (unit === "px" ? value : value * 16);
const LENGTH = /([\d.]+)(px|rem)\b/g;

// Custom properties declared anywhere in the scanned sources, so var(--token) resolves to its value.
function collectTokens(sources) {
  const tokens = new Map();
  for (const source of sources) {
    for (const match of source.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

function resolveVars(body, tokens, depth = 0) {
  if (depth > 4) return body;
  return body.replace(/var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g, (whole, name) =>
    tokens.has(name) ? resolveVars(tokens.get(name), tokens, depth + 1) : whole);
}

// Splits the arguments of a leading clamp()/min()/max() at nesting depth zero.
function topLevelArgs(body) {
  const open = body.indexOf("(");
  if (open < 0) return [];
  const args = [];
  let depth = 0;
  let current = "";
  for (const ch of body.slice(open + 1)) {
    if (ch === "(") depth += 1;
    if (ch === ")") {
      if (depth === 0) break;
      depth -= 1;
    }
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  args.push(current.trim());
  return args;
}

// Decides whether one font-size value can resolve below the floor.
function belowFloor(rawBody, tokens) {
  const body = resolveVars(rawBody.trim(), tokens);
  if (/^(?:x-small|xx-small|small|smaller)\b/.test(body)) return true;
  // Only top-level plain lengths are sizes; a length nested in calc() is an offset, not a floor.
  const lengths = topLevelArgs(body).flatMap((arg) => {
    const m = arg.match(/^([\d.]+)(px|rem)$/);
    return m ? [toPx(Number(m[1]), m[2])] : [];
  });
  if (/^max\(/.test(body)) return lengths.length > 0 && Math.max(...lengths) < MIN_PX;
  if (/^(?:clamp|min)\(/.test(body)) return lengths.some((px) => px < MIN_PX);
  if (/^[\d.]+(?:em|%)/.test(body)) return true; // relative to an unknown parent: needs review
  const plain = body.match(/^([\d.]+)(px|rem)\b/);
  return Boolean(plain && toPx(Number(plain[1]), plain[2]) < MIN_PX);
}

// Returns every authored size that resolves below the floor: font-size declarations, the font
// shorthand, Tailwind arbitrary text-[..] utilities and numeric TSX fontSize values.
export function subMinimumSizes(source, tokens = new Map()) {
  const found = [];
  for (const match of source.matchAll(/font-size\s*:\s*([^;}]+)/g)) {
    if (belowFloor(match[1], tokens)) found.push(match[0].trim());
  }
  for (const match of source.matchAll(/(?:^|[;{\s])font\s*:\s*([^;}]+)/g)) {
    const rest = match[1].replace(/^(?:\s*(?:italic|oblique|normal|bold|bolder|lighter|small-caps|\d{3})\s+)*/, "");
    const size = rest.match(/^(?:clamp|min|max)\((?:[^()]|\([^()]*\))*\)|^[^\s/]+/);
    if (size && belowFloor(size[0], tokens)) found.push(match[0].trim());
  }
  for (const match of source.matchAll(/\btext-\[([\d.]+)(px|rem)\]/g)) {
    if (toPx(Number(match[1]), match[2]) < MIN_PX) found.push(match[0]);
  }
  for (const match of source.matchAll(/\bfontSize\s*:\s*"?([\d.]+)(px|rem)?"?/g)) {
    if (toPx(Number(match[1]), match[2] ?? "px") < MIN_PX) found.push(match[0]);
  }
  return found;
}

test("the scanner flags px, rem, clamp-floor and Tailwind arbitrary sizes below 12px", () => {
  assert.equal(subMinimumSizes("a{font-size:11px}").length, 1);
  assert.equal(subMinimumSizes("a{font-size:.7rem}").length, 1);
  assert.equal(subMinimumSizes("a{font-size:clamp(.6rem,1vw,1rem)}").length, 1);
  assert.equal(subMinimumSizes('<p className="text-[10px]">').length, 1);
});

test("the scanner flags the font shorthand, keywords, em and percent, every min/clamp argument and TSX numbers", () => {
  assert.equal(subMinimumSizes("a{font:500 .7rem/1.2 serif}").length, 1);
  assert.equal(subMinimumSizes("a{font:italic 600 clamp(.6rem,1vw,1rem)/1.1 serif}").length, 1);
  assert.equal(subMinimumSizes("a{font-size:smaller}b{font-size:x-small}").length, 2);
  assert.equal(subMinimumSizes("a{font-size:.8em}b{font-size:80%}").length, 2);
  assert.equal(subMinimumSizes("a{font-size:min(2rem,.6rem)}").length, 1);
  assert.deepEqual(subMinimumSizes("a{font-size:clamp(2.4rem,calc(5.25vw - .625rem),3.5rem)}"), []);
  assert.equal(subMinimumSizes("const s = { fontSize: 10 };").length, 1);
  assert.equal(subMinimumSizes('const s = { fontSize: "0.7rem" };').length, 1);
});

test("the scanner resolves custom properties before judging a size", () => {
  const tokens = collectTokens([":root{--small-text:.7rem;--ok-text:.8rem}"]);
  assert.equal(subMinimumSizes("a{font-size:var(--small-text)}", tokens).length, 1);
  assert.deepEqual(subMinimumSizes("a{font-size:var(--ok-text)}", tokens), []);
});

test("the scanner accepts 12px and larger", () => {
  assert.deepEqual(subMinimumSizes("a{font-size:12px}b{font-size:.75rem}c{font-size:clamp(.75rem,1vw,1rem)}"), []);
  assert.deepEqual(subMinimumSizes("a{font-size:max(.75rem,1em)}b{font:500 .94rem/1.4 serif}c{font:clamp(1rem,2vw,2rem) serif}"), []);
  assert.deepEqual(subMinimumSizes('<p className="text-xs text-[12px]">'), []);
  assert.deepEqual(subMinimumSizes("const s = { fontSize: 24 };"), []);
});

test("no authored stylesheet or component declares text below 12px", () => {
  const paths = files(ROOT);
  assert.ok(paths.length > 100, "the scan must actually cover the source tree");
  const sources = paths.map((file) => [file, readFileSync(file, "utf8")]);
  const tokens = collectTokens(sources.map(([, source]) => source));
  const offenders = sources.flatMap(([file, source]) => subMinimumSizes(source, tokens).map((hit) => `${file}: ${hit}`));
  assert.deepEqual(offenders, []);
});
