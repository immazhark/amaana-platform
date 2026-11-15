import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const modulePath = "src/components/evidence-pathway.module.css";

test("AF-R066 includes the public evidence-pathway stylesheet in pinned Stylelint governance", () => {
  const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const command = manifest.scripts?.["stylelint:governed"];
  assert.equal(typeof command, "string");
  assert.match(command, /stylelint@17\.16\.0/);
  const targets = command.trim().split(/\s+/u);
  assert.ok(targets.includes(modulePath), `Stylelint scope omits ${modulePath}`);
});

test("AF-R066 public evidence-pathway styles do not use ungoverned hex literals", () => {
  const css = readFileSync(new URL(modulePath, root), "utf8");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/u);
});

test("AF-R066 inherits the existing hex-color and duplicate-selector rules", () => {
  const config = readFileSync(new URL("stylelint.config.mjs", root), "utf8");
  assert.match(config, /"color-no-hex"\s*:\s*true/u);
  assert.match(config, /"no-duplicate-selectors"\s*:\s*true/u);
});

test("AF-R066 includes public-route loading fallback in governed Stylelint targets", () => {
  const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const targets = manifest.scripts["stylelint:governed"].trim().split(/\s+/u);
  assert.ok(targets.includes("src/components/public-route-loading.module.css"), "Missing governed loading stylesheet");
});

test("AF-R066 public-route loading styles contain no ungoverned hex literals", () => {
  const css = readFileSync(new URL("src/components/public-route-loading.module.css", root), "utf8");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/u);
});
