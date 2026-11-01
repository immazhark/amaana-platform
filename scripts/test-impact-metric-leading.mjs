import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Impact metric display text has readable multiline leading", async () => {
  const source = await readFile("src/app/impact/impact-refinement.module.css", "utf8");
  const rule = /:global\(\.v2-impact-tile-copy strong\)\s*\{([^}]+)\}/.exec(source)?.[1];
  assert.ok(rule, "Impact tile metric selector must remain present");
  const lineHeight = /\bline-height:\s*(\d*\.?\d+)\s*;/.exec(rule)?.[1];
  assert.ok(lineHeight, "Impact metric must declare explicit unitless leading");
  assert.ok(Number(lineHeight) >= 1.05, `Impact metric leading ${lineHeight} is too tight for wrapping`);
});
