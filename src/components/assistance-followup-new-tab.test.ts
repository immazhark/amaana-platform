import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, test } from "vitest";

test("assistance follow-up contact link announces its new tab to screen reader users", () => {
  const source = readFileSync(new URL("./assistance-form.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("assistance-form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const links: ts.JsxElement[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === "a") {
      const attributes = node.openingElement.getText(file);
      if (attributes.includes('href="/contact"') && attributes.includes('target="_blank"')) links.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);

  expect(links, "the follow-up contact recovery action").toHaveLength(1);
  const link = links[0];
  if (!link) throw new Error("Missing follow-up contact link");
  expect(link.openingElement.getText(file)).toContain('rel="noreferrer"');
  const disclosure = link.children.find(child =>
    ts.isJsxElement(child)
    && child.openingElement.tagName.getText(file) === "span"
    && child.openingElement.getText(file).includes('className="sr-only"'),
  );
  expect(disclosure, "screen-reader new-tab context disclosure").toBeDefined();
  if (!disclosure || !ts.isJsxElement(disclosure)) return;
  expect(disclosure.children.map(child => child.getText(file)).join(""))
    .toContain("opens in a new tab");
});
