import assert from "node:assert/strict";
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
