import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

// Synthetic JSX only. This does not inspect or write private donor data.
test("AF-R069 enforces accessible form labels in governed TSX", async () => {
  const eslint = new ESLint();
  const filePath = "src/components/__amaana_synthetic_lint_contract__.tsx";
  const effective = await eslint.calculateConfigForFile(filePath);
  assert.equal(effective?.rules?.["jsx-a11y/label-has-associated-control"]?.[0], 2,
    "Association of labels and form controls must be an error, not an advisory");

  const missing = await eslint.lintText(
    "export function Invalid() { return <div><label>Contact name</label><input id='contact-name' /></div>; }",
    { filePath },
  );
  const errors = missing[0].messages.filter(message =>
    message.ruleId === "jsx-a11y/label-has-associated-control" && message.severity === 2);
  assert.equal(errors.length, 1, "A sibling input does not associate an unbound label");

  const associated = await eslint.lintText(
    "export function Valid() { return <div><label htmlFor='contact-name'>Contact name</label><input id='contact-name' /></div>; }",
    { filePath },
  );
  assert.equal(associated[0].messages.filter(message =>
    message.ruleId === "jsx-a11y/label-has-associated-control").length, 0,
    "An explicitly associated label must remain valid");

  const nested = await eslint.lintText(
    "export function Nested() { return <label><input type='checkbox' /><span><strong>Consent verified</strong><small>Confirmed by the reviewer</small></span></label>; }",
    { filePath },
  );
  assert.equal(nested[0].messages.filter(message =>
    message.ruleId === "jsx-a11y/label-has-associated-control").length, 0,
    "A label wrapping a control with meaningful nested text must remain accessible");

});

test("AF-R066 lints three existing token-safe public component styles", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = JSON.parse(await readFile("package.json", "utf8"));
  assert.match(config.scripts.lint, /npm run stylelint:governed/);
  const lintCommand = config.scripts["stylelint:governed"];
  assert.ok(lintCommand.startsWith("npx --yes stylelint@17.16.0 "));
  for (const file of [
    "src/components/policy-toc.module.css",
    "src/components/section-heading.module.css",
    "src/components/site-header.module.css",
  ]) {
    assert.ok(lintCommand.split(/\s+/).includes(file), `Missing governed Stylelint coverage for ${file}`);
  }
});
