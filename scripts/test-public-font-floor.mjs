import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { auditFontSizes, auditPublicStyles } from "./public-font-floor.mjs";

test("font sizes below 12px are rejected in compact and formatted CSS", () => {
  const css = ".label{font-size:.68rem}.small { font-size: 11px; }";
  assert.deepEqual(auditFontSizes(css, "fixture.css"), [
    { path: "fixture.css", value: ".68rem" },
    { path: "fixture.css", value: "11px" },
  ]);
});

test("small clamp and max bounds cannot bypass the font-size floor", () => {
  const css = "@media(max-width:600px){.label{font-size:clamp(.62rem,1vw,.8rem)}.other{font-size:max(10px,1vw)}}";
  assert.deepEqual(auditFontSizes(css, "fixture.css").map(({ value }) => value), [
    "clamp(.62rem,1vw,.8rem)",
    "max(10px,1vw)",
  ]);
});

test("12px and .75rem remain valid; comments and icon-only zero do not trip the guard", () => {
  const css = "/* font-size:7px */.a{font-size:12px}.b{font-size:.75rem}.icon{font-size:0}.c{font-size:clamp(.75rem,2vw,1rem)}";
  assert.deepEqual(auditFontSizes(css, "fixture.css"), []);
});

test("a safe clamp floor is not rejected for a smaller calc subtraction", () => {
  const css = ".heading{font-size:clamp(2.4rem,calc(5.25vw - .625rem),3.5rem)}";
  assert.deepEqual(auditFontSizes(css, "fixture.css"), []);
});

test("all checked public and component CSS preserves the 12px literal floor", async () => {
  assert.deepEqual(await auditPublicStyles(), []);
});


test("font shorthand cannot hide sub-12px literal sizes", () => {
  const css = [
    ".tiny{font:600 11px/1.4 system-ui}",
    ".compact{font:italic .68rem/1.3 serif}",
    ".fluid{font:700 clamp(.62rem,1vw,.8rem)/1.2 system-ui}",
  ].join("");
  assert.deepEqual(auditFontSizes(css, "fixture.css"), [
    { path: "fixture.css", value: "600 11px/1.4 system-ui" },
    { path: "fixture.css", value: "italic .68rem/1.3 serif" },
    { path: "fixture.css", value: "700 clamp(.62rem,1vw,.8rem)/1.2 system-ui" },
  ]);
});

test("font shorthand uses font-size, never its smaller line-height, for the minimum", () => {
  const css = [
    ".safe{font:600 1rem/10px system-ui}",
    ".safeClamp{font:500 clamp(.75rem,2vw,1rem)/.5rem system-ui}",
    ".inherit{font:inherit}",
  ].join("");
  assert.deepEqual(auditFontSizes(css, "fixture.css"), []);
});

test("constant CSS calc arithmetic cannot bypass the public 12px font floor", () => {
  const bad = [
    ".multiplied{font-size:calc(1rem * .5)}",
    ".divided{font-size:calc(1rem / 2)}",
    ".inverse{font-size:calc(2 * .3rem)}",
  ].join("");
  assert.deepEqual(auditFontSizes(bad, "fixture.css"), [
    { path: "fixture.css", value: "calc(1rem * .5)" },
    { path: "fixture.css", value: "calc(1rem / 2)" },
    { path: "fixture.css", value: "calc(2 * .3rem)" },
  ]);

  const safe = [
    ".enlarged{font-size:calc(11px * 2)}",
    ".same{font-size:calc(1rem / 1)}",
    ".inverse{font-size:calc(2 * .75rem)}",
  ].join("");
  assert.deepEqual(auditFontSizes(safe, "fixture.css"), []);
});

test("same-unit CSS calc additions and subtractions use the computed final font-size", () => {
  const safe = [
    ".safeRem{font-size:calc(.5rem + .25rem)}",
    ".safePx{font-size:calc(20px - 4px)}",
    ".safeLarge{font-size:calc(11px + 2px)}",
    ".safeRemSubtract{font-size:calc(1rem - .125rem)}",
  ].join("");
  assert.deepEqual(auditFontSizes(safe, "fixture.css"), []);

  const unsafe = [
    ".badRem{font-size:calc(.5rem + .2rem)}",
    ".badPx{font-size:calc(16px - 5px)}",
    ".negative{font-size:calc(12px - 13px)}",
  ].join("");
  assert.deepEqual(auditFontSizes(unsafe, "fixture.css"), [
    { path: "fixture.css", value: "calc(.5rem + .2rem)" },
    { path: "fixture.css", value: "calc(16px - 5px)" },
    { path: "fixture.css", value: "calc(12px - 13px)" },
  ]);
});

test("chained constant CSS calc scalar operations must use the final font size", () => {
  const unsafe = [
    ".multiplied{font-size:calc(1rem * .5 * .5)}",
    ".divided{font-size:calc(1rem / 2 / 2)}",
    ".mixedOps{font-size:calc(16px * 2 / 4)}",
    ".zeroDivisor{font-size:calc(1rem * 2 / 0)}",
  ].join("");
  assert.deepEqual(auditFontSizes(unsafe, "fixture.css").map(({ value }) => value), [
    "calc(1rem * .5 * .5)",
    "calc(1rem / 2 / 2)",
    "calc(16px * 2 / 4)",
    "calc(1rem * 2 / 0)",
  ]);

  const safe = [
    ".scaled{font-size:calc(10px * 2 * 2)}",
    ".remScaled{font-size:calc(.5rem * 2 * 2)}",
    ".mixedOps{font-size:calc(2rem / 2 * 2)}",
  ].join("");
  assert.deepEqual(auditFontSizes(safe, "fixture.css"), []);
});

test("nested min(calc()) must not hide a constant sub-12px font size", () => {
  const unsafe = [
    ".tooSmall{font-size:min(calc(1rem * .5), 1rem)}",
    ".alsoTooSmall{font-size:min(calc(1rem / 2), 14px)}",
  ].join("");
  assert.deepEqual(auditFontSizes(unsafe, "fixture.css").map(({ value }) => value), [
    "min(calc(1rem * .5), 1rem)",
    "min(calc(1rem / 2), 14px)",
  ]);
  const safe = [
    ".allowed{font-size:min(calc(1rem * 2), 14px)}",
    ".allowedPx{font-size:min(calc(16px / 1), 1rem)}",
  ].join("");
  assert.deepEqual(auditFontSizes(safe, "fixture.css"), []);
});

test("min() rejects a smaller constant calc in its second position", () => {
  const css = [
    ".rem{font-size:min(1rem, calc(1rem * .5))}",
    ".px{font-size:min(1rem,calc(20px / 2))}",
    ".nested{font-size:min(1rem, calc(1rem / 0))}",
  ].join("");
  assert.deepEqual(auditFontSizes(css, "fixture.css").map(({ value }) => value), [
    "min(1rem, calc(1rem * .5))",
    "min(1rem,calc(20px / 2))",
    "min(1rem, calc(1rem / 0))",
  ]);
  assert.deepEqual(auditFontSizes(
    ".safe{font-size:min(1rem, calc(20px * 1.5))}", "fixture.css"
  ), []);
});

test("public CSS audit rejects linked stylesheet files instead of silently ignoring them", async () => {
  const root = await mkdtemp(join(tmpdir(), "amaana-css-audit-file-"));
  try {
    await mkdir(join(root, "src"));
    await writeFile(join(root, "hidden.css"), ".bad{font-size:7px}");
    await symlink(join(root, "hidden.css"), join(root, "src", "linked.css"));
    await assert.rejects(auditPublicStyles(root), /symbolic link/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("public CSS audit rejects linked source directories rather than skipping nested styles", async () => {
  const root = await mkdtemp(join(tmpdir(), "amaana-css-audit-directory-"));
  try {
    await mkdir(join(root, "src"));
    await mkdir(join(root, "hidden"));
    await writeFile(join(root, "hidden", "bad.css"), ".bad{font-size:7px}");
    await symlink(join(root, "hidden"), join(root, "src", "linked"));
    await assert.rejects(auditPublicStyles(root), /symbolic link/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("public CSS audit rejects a linked src root rather than trusting an external tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "amaana-css-audit-root-"));
  try {
    await mkdir(join(root, "alternate-src"));
    await writeFile(join(root, "alternate-src", "bad.css"), ".bad{font-size:7px}");
    await symlink(join(root, "alternate-src"), join(root, "src"));
    await assert.rejects(auditPublicStyles(root), /symbolic link/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("public CSS audit still scans ordinary nested CSS and rejects literal small type", async () => {
  const root = await mkdtemp(join(tmpdir(), "amaana-css-audit-regular-"));
  try {
    await mkdir(join(root, "src", "nested"), { recursive: true });
    await writeFile(join(root, "src", "nested", "bad.css"), ".bad{font-size:7px}");
    assert.deepEqual(await auditPublicStyles(root), [
      { path: "src/nested/bad.css", value: "7px" },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
