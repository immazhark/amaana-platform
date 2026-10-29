import { readFileSync } from "node:fs";
import ts from "typescript";
import { expect, test } from "vitest";

test("curated gallery initiative previews announce their new tab", () => {
  const source = readFileSync(new URL("./curated-gallery-importer.tsx", import.meta.url), "utf8");
  const file = ts.createSourceFile("curated-gallery-importer.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const previews: ts.JsxElement[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === "a") {
      const opening = node.openingElement.getText(file);
      if (opening.includes('target="_blank"') && opening.includes("/our-work/")) previews.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);

  expect(previews).toHaveLength(1);
  const preview = previews[0];
  if (!preview) throw new Error("The reviewed initiative preview anchor is missing");
  expect(preview.openingElement.getText(file)).toContain('rel="noreferrer"');

  const disclosure = preview.children.find(child => ts.isJsxElement(child)
    && child.openingElement.tagName.getText(file) === "span"
    && child.openingElement.getText(file).includes('className="sr-only"'));
  expect(disclosure, "screen-reader-only new-tab disclosure").toBeDefined();
  if (!disclosure || !ts.isJsxElement(disclosure)) return;
  expect(disclosure.children.map(child => child.getText(file)).join(""))
    .toContain("opens in a new tab");
});
