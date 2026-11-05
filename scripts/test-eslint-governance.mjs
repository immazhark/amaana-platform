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
});
